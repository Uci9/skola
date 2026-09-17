import { imaBazu, mojProfil, porukaGreske, dokumenti } from './baza.js';

const spisak = document.getElementById('spisak');
if (spisak) {
  const polje = document.getElementById('trazi');
  const brojac = document.getElementById('brojac');
  const prazno = document.getElementById('prazno');
  const rubrike = document.getElementById('rubrike');
  const glas = document.getElementById('glas');
  const straza = document.getElementById('straza');
  const alat = document.getElementById('alat');
  const prekidac = document.getElementById('prekidac');
  const naslovPogleda = document.getElementById('naslov-pogleda');
  const opisPogleda = document.getElementById('opis-pogleda');

  let sve = [];
  let mogu = false;
  let prijavljen = false;
  let rubrika = new URLSearchParams(location.search).get('rubrika') || '';
  let pogled = location.hash === '#nastavnici' ? 'nastavnici' : 'ucenici';

  function javi(tekst, dobro) {
    glas.textContent = tekst;
    glas.hidden = !tekst;
    glas.classList.toggle('dobro', Boolean(dobro));
    glas.classList.toggle('lose', Boolean(tekst) && !dobro);
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

  function zaPogled() {
    if (pogled === 'ucenici') return sve.filter(d => !d.zakljucan);
    return sve;
  }

  function crtaj() {
    const moji = zaPogled();
    const upit = bezKvaka(polje.value.trim());
    const nadjeni = moji.filter(d => {
      if (rubrika && d.rubrika !== rubrika) return false;
      if (!upit) return true;
      return bezKvaka([d.naslov, d.opis, d.predmet, d.ime_datoteke, d.postavio].join(' ')).includes(upit);
    });

    brojac.textContent = nadjeni.length + ' od ' + moji.length;
    prazno.textContent = moji.length
      ? 'Ništa ne odgovara pretrazi.'
      : 'Ovdje još nema dokumenata.';
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

      karta.appendChild(tijelo);
      spisak.appendChild(karta);
    });
  }

  function postaviPogled(novi) {
    pogled = novi;
    [...prekidac.children].forEach(b => b.classList.toggle('on', b.dataset.pogled === novi));
    history.replaceState(null, '', novi === 'nastavnici' ? '#nastavnici' : '#ucenici');

    const zaNastavnike = novi === 'nastavnici';
    naslovPogleda.textContent = zaNastavnike ? 'Za nastavnike' : 'Za učenike';
    opisPogleda.textContent = zaNastavnike
      ? 'Sve što škola drži u Moodle-u, uključujući zaključano — vidljivo samo nastavnicima i upravi.'
      : 'Gradivo, dokumenta i obavještenja koja su otvorena za sve.';

    const zabrana = zaNastavnike && !mogu;
    straza.hidden = !zabrana;
    straza.querySelector('[data-neprijavljen]').hidden = prijavljen;
    straza.querySelector('[data-prijavljen]').hidden = !prijavljen;
    alat.hidden = zabrana;
    spisak.hidden = zabrana;
    if (zabrana) {
      prazno.hidden = true;
      return;
    }
    crtaj();
  }

  [...prekidac.children].forEach(b => b.addEventListener('click', () => postaviPogled(b.dataset.pogled)));
  addEventListener('hashchange', () => postaviPogled(location.hash === '#nastavnici' ? 'nastavnici' : 'ucenici'));
  polje.addEventListener('input', crtaj);

  (async function kreni() {
    if (!(await imaBazu())) {
      javi('Baza nije podešena, pa dokumenti ne rade.');
      alat.hidden = true;
      return;
    }

    const profil = await mojProfil();
    prijavljen = Boolean(profil);

    let odgovor;
    try {
      odgovor = await dokumenti();
    } catch (greska) {
      javi(porukaGreske(greska));
      return;
    }

    sve = odgovor.dokumenti;
    mogu = odgovor.mogu;
    crtajRubrike(odgovor.rubrike);
    postaviPogled(pogled);
  })();
}
