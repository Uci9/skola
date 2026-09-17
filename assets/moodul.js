import {
  imaBazu, mojProfil, porukaGreske,
  dokumenti, posaljiDokument, izmijeniDokument, obrisiDokument
} from './baza.js';

const spisak = document.getElementById('spisak');
if (spisak) {
  const polje = document.getElementById('trazi');
  const brojac = document.getElementById('brojac');
  const prazno = document.getElementById('prazno');
  const rubrike = document.getElementById('rubrike');
  const glas = document.getElementById('glas');
  const poziv = document.getElementById('dodaj-poziv');
  const forma = document.getElementById('dodaj-forma');
  const glasForme = document.getElementById('dodaj-glas');

  let sve = [];
  let mogu = false;
  let ja = null;
  let rubrika = new URLSearchParams(location.search).get('rubrika') || '';

  function javi(gdje, tekst, dobro) {
    gdje.textContent = tekst;
    gdje.hidden = !tekst;
    gdje.classList.toggle('dobro', Boolean(dobro));
    gdje.classList.toggle('lose', Boolean(tekst) && !dobro);
  }

  function bezKvaka(t) {
    return String(t || '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function mjera(bajtova) {
    if (bajtova >= 1024 * 1024) return (bajtova / (1024 * 1024)).toFixed(1) + ' MB';
    return Math.max(1, Math.round(bajtova / 1024)) + ' kB';
  }

  function nastavak(ime) {
    const tacka = ime.lastIndexOf('.');
    return tacka > 0 ? ime.slice(tacka + 1).toUpperCase().slice(0, 4) : 'FAJL';
  }

  function datum(v) {
    if (!v) return '';
    return new Date(v).toLocaleDateString('sr-Latn', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function crtajRubrike(spisakRubrika) {
    rubrike.textContent = '';
    [['', 'Sve']].concat(spisakRubrika.map(r => [r, r])).forEach(([kljuc, ime]) => {
      const t = document.createElement('button');
      t.type = 'button';
      t.className = 'tab' + (kljuc === rubrika ? ' on' : '');
      t.textContent = ime;
      t.addEventListener('click', () => {
        rubrika = kljuc;
        [...rubrike.children].forEach(x => x.classList.toggle('on', x === t));
        crtaj();
      });
      rubrike.appendChild(t);
    });
  }

  function crtaj() {
    const upit = bezKvaka(polje.value.trim());
    const nadjeni = sve.filter(d => {
      if (rubrika && d.rubrika !== rubrika) return false;
      if (!upit) return true;
      return bezKvaka([d.naslov, d.opis, d.predmet, d.ime_datoteke, d.postavio].join(' ')).includes(upit);
    });

    brojac.textContent = nadjeni.length + ' od ' + sve.length;
    prazno.hidden = nadjeni.length > 0;
    spisak.textContent = '';

    nadjeni.forEach(d => {
      const karta = document.createElement('article');
      karta.className = 'dok' + (d.zakljucan ? ' zakljucan' : '');

      const vrsta = document.createElement('span');
      vrsta.className = 'dok-vrsta';
      vrsta.textContent = nastavak(d.ime_datoteke);
      karta.appendChild(vrsta);

      const tijelo = document.createElement('div');
      tijelo.className = 'dok-tijelo';

      const gore = document.createElement('div');
      gore.className = 'dok-gore';

      const naslov = document.createElement('h3');
      const veza = document.createElement('a');
      veza.href = '/dokument/' + d.id;
      veza.textContent = d.naslov;
      veza.target = '_blank';
      veza.rel = 'noopener';
      naslov.appendChild(veza);
      gore.appendChild(naslov);

      if (d.zakljucan) {
        const znak = document.createElement('span');
        znak.className = 'dok-znak';
        znak.textContent = 'Samo nastavnici';
        gore.appendChild(znak);
      }

      tijelo.appendChild(gore);

      if (d.opis) {
        const o = document.createElement('p');
        o.textContent = d.opis;
        tijelo.appendChild(o);
      }

      const uz = document.createElement('p');
      uz.className = 'dok-uz';
      uz.textContent = [d.rubrika, d.predmet, d.postavio, datum(d.napravljeno), mjera(d.velicina)]
        .filter(Boolean).join(' · ');
      tijelo.appendChild(uz);

      if (mogu && (d.vlasnik === ja || ja === 'admin')) {
        const radnje = document.createElement('div');
        radnje.className = 'dok-radnje';

        const kljuc = document.createElement('button');
        kljuc.type = 'button';
        kljuc.className = 'btn btn-line mali';
        kljuc.textContent = d.zakljucan ? 'Otključaj' : 'Zaključaj';
        kljuc.addEventListener('click', async () => {
          kljuc.disabled = true;
          try {
            await izmijeniDokument(d.id, { zakljucan: !d.zakljucan });
          } catch (greska) {
            javi(glas, porukaGreske(greska));
            kljuc.disabled = false;
            return;
          }
          ucitaj();
        });
        radnje.appendChild(kljuc);

        const brisi = document.createElement('button');
        brisi.type = 'button';
        brisi.className = 'btn btn-line mali';
        brisi.textContent = 'Obriši';
        brisi.addEventListener('click', async () => {
          if (!confirm('Obrisati „' + d.naslov + '“?')) return;
          try {
            await obrisiDokument(d.id);
          } catch (greska) {
            javi(glas, porukaGreske(greska));
            return;
          }
          ucitaj();
        });
        radnje.appendChild(brisi);

        tijelo.appendChild(radnje);
      }

      karta.appendChild(tijelo);
      spisak.appendChild(karta);
    });
  }

  async function ucitaj() {
    let odgovor;
    try {
      odgovor = await dokumenti();
    } catch (greska) {
      javi(glas, porukaGreske(greska));
      return;
    }

    sve = odgovor.dokumenti;
    mogu = odgovor.mogu;
    ja = odgovor.uloga === 'admin' ? 'admin' : odgovor.ja;
    crtajRubrike(odgovor.rubrike);
    crtaj();
    javi(glas, '');

    if (forma) {
      const izbor = forma.elements.rubrika;
      if (izbor && !izbor.options.length) {
        odgovor.rubrike.forEach(r => izbor.add(new Option(r, r)));
        izbor.value = 'Dokumenta';
      }
      forma.hidden = !mogu;
      poziv.hidden = mogu;
    }
  }

  polje.addEventListener('input', crtaj);

  if (forma) {
    forma.addEventListener('submit', async e => {
      e.preventDefault();
      const fajl = forma.elements.datoteka.files[0];
      if (!fajl) { javi(glasForme, 'Izaberi datoteku.'); return; }

      const dugme = forma.querySelector('button[type=submit]');
      dugme.disabled = true;
      javi(glasForme, 'Šaljem…');

      try {
        await posaljiDokument(fajl, {
          naslov: forma.elements.naslov.value.trim(),
          opis: forma.elements.opis.value.trim(),
          predmet: forma.elements.predmet.value.trim(),
          rubrika: forma.elements.rubrika.value,
          zakljucan: forma.elements.zakljucan.checked
        });
      } catch (greska) {
        dugme.disabled = false;
        javi(glasForme, porukaGreske(greska));
        return;
      }

      dugme.disabled = false;
      forma.reset();
      javi(glasForme, 'Dokument je postavljen.', true);
      ucitaj();
    });
  }

  (async function pripremi() {
    if (!(await imaBazu())) {
      javi(glas, 'Baza nije podešena, pa dokumenti ne rade.');
      poziv.hidden = true;
      return;
    }

    const profil = await mojProfil();
    if (profil && poziv) {
      const dio = poziv.querySelector('[data-prijavljen]');
      const drugi = poziv.querySelector('[data-neprijavljen]');
      if (dio) dio.hidden = false;
      if (drugi) drugi.hidden = true;
    }

    ucitaj();
  })();
}
