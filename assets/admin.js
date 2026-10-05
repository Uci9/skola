import {
  imaBazu, jeAdmin, mojProfil, porukaGreske, posaljiSliku,
  spisak as izBaze, dodaj, izmijeni, obrisi as obrisiIzBaze, profili, postaviUlogu,
  prijedlozi, obrisiPrijedlog,
  dokumenti, posaljiDokument, izmijeniDokument, obrisiDokument,
  pregled, zakljucajKurseve, moodleArhiva, odjaviSe,
  firme, obrisiFirmu, novo, pregledano
} from './baza.js';
import { RAZREDI, PREDMETI, SVI_RAZREDI, RUCNO } from './predmeti.js';

const strazar = document.getElementById('strazar');
const panel = document.getElementById('panel');
const tabovi = document.getElementById('tabovi');
const sadrzaj = document.getElementById('sadrzaj');
const pozdrav = document.getElementById('pozdrav');
const naslovTaba = document.getElementById('naslov-taba');
const opisTaba = document.getElementById('opis-taba');

const TABOVI = {
  pregled: ['Pregled', 'Stanje sajta na jednom mjestu.'],
  moodle: ['Moodle', 'Zaključan kurs otvaraju samo nastavnici i admin. Ostali vide naziv i katanac.'],
  dokumenti: ['Dokumenti', 'Fajlovi koje nastavnici postavljaju u Moodle sajta.'],
  novosti: ['Novosti', 'Obavještenja i rokovi na strani Novosti.'],
  kutak: ['Kutak učenika', 'Galerija đačkog života.'],
  prijedlozi: ['Slike učenika', 'Slike koje su učenici poslali za kutak. Prebaci ih ili obriši.'],
  firme: ['Firme', 'Upitnici koje su firme poslale upravi škole.'],
  nastavnici: ['Nastavnici', 'Spisak na strani Nastavnici i osoblje.'],
  poslodavci: ['Poslodavci', 'Partneri kod kojih učenici rade praksu.'],
  nalozi: ['Nalozi', 'Ko ima nalog na sajtu i koju ulogu.']
};

const GRUPE = [
  ['uprava', 'Uprava i stručna služba'],
  ['nastavno', 'Nastavno osoblje'],
  ['asistenti', 'Asistenti'],
  ['pomocno', 'Pomoćno osoblje']
];

const SEKCIJE = {
  novosti: {
    naziv: 'Novosti',
    tabela: 'novosti',
    red: ['datum', false],
    polja: [
      { k: 'naslov', o: 'Naslov', t: 'text', obavezno: true },
      { k: 'rubrika', o: 'Rubrika', t: 'text' },
      { k: 'datum', o: 'Datum', t: 'date' },
      { k: 'tekst', o: 'Tekst', t: 'textarea' },
      { k: 'slika', o: 'Slika', t: 'slika' }
    ],
    glavno: r => r.naslov,
    uz: r => [r.rubrika, r.datum].filter(Boolean).join(' · ')
  },
  kutak: {
    naziv: 'Kutak učenika',
    tabela: 'kutak',
    red: ['napravljeno', false],
    polja: [
      { k: 'naslov', o: 'Naslov', t: 'text', obavezno: true },
      { k: 'kategorija', o: 'Kategorija', t: 'text' },
      { k: 'opis', o: 'Opis', t: 'textarea' },
      { k: 'slika', o: 'Slika', t: 'slika' }
    ],
    glavno: r => r.naslov,
    uz: r => r.kategorija || ''
  },
  nastavnici: {
    naziv: 'Nastavnici',
    tabela: 'nastavnici',
    red: ['redoslijed', true],
    polja: [
      { k: 'ime', o: 'Ime i prezime', t: 'text', obavezno: true },
      { k: 'zvanje', o: 'Zvanje', t: 'text' },
      { k: 'grupa', o: 'Grupa', t: 'izbor', izbori: GRUPE },
      { k: 'biografija', o: 'Biografija', t: 'textarea' },
      { k: 'slika', o: 'Slika', t: 'slika' },
      { k: 'redoslijed', o: 'Redoslijed', t: 'number' }
    ],
    glavno: r => r.ime,
    uz: r => [r.zvanje, (GRUPE.find(g => g[0] === r.grupa) || [])[1]].filter(Boolean).join(' · ')
  },
  poslodavci: {
    naziv: 'Poslodavci',
    tabela: 'poslodavci',
    red: ['napravljeno', false],
    polja: [
      { k: 'naziv', o: 'Naziv', t: 'text', obavezno: true },
      { k: 'oznaka', o: 'Oznaka', t: 'text' },
      { k: 'opis', o: 'Opis', t: 'textarea' }
    ],
    glavno: r => r.naziv,
    uz: r => r.oznaka || ''
  }
};

function el(html) {
  const d = document.createElement('div');
  d.innerHTML = html.trim();
  return d.firstElementChild;
}

function tekst(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function javi(gdje, poruka, dobro) {
  gdje.textContent = poruka;
  gdje.hidden = !poruka;
  gdje.classList.toggle('dobro', Boolean(dobro));
  gdje.classList.toggle('lose', Boolean(poruka) && !dobro);
}

function poljeHTML(p, v) {
  const val = tekst(v);
  if (p.t === 'textarea') {
    return `<label class="f"><span>${p.o}</span><textarea name="${p.k}" rows="5">${val}</textarea></label>`;
  }
  if (p.t === 'izbor') {
    const opcije = p.izbori.map(([k, o]) =>
      `<option value="${k}"${k === v ? ' selected' : ''}>${o}</option>`).join('');
    return `<label class="f"><span>${p.o}</span><select name="${p.k}">${opcije}</select></label>`;
  }
  if (p.t === 'slika') {
    return `<div class="f polje-slika">
      <span>${p.o}</span>
      <input type="hidden" name="${p.k}" value="${val}">
      <div class="slika-red">
        <img class="slika-pregled"${v ? ` src="${val}"` : ' hidden'} alt="">
        <input type="file" accept="image/*" class="slika-ulaz">
        <button type="button" class="btn btn-line mali skini-sliku"${v ? '' : ' hidden'}>Ukloni</button>
      </div>
    </div>`;
  }
  const obavezno = p.obavezno ? ' required' : '';
  return `<label class="f"><span>${p.o}</span><input type="${p.t}" name="${p.k}" value="${val}"${obavezno}></label>`;
}

function vezisliku(forma, glasnik) {
  forma.querySelectorAll('.polje-slika').forEach(polje => {
    const skriveno = polje.querySelector('input[type=hidden]');
    const pregled = polje.querySelector('.slika-pregled');
    const ulaz = polje.querySelector('.slika-ulaz');
    const skini = polje.querySelector('.skini-sliku');

    ulaz.addEventListener('change', async () => {
      const f = ulaz.files[0];
      if (!f) return;
      javi(glasnik, 'Šaljem sliku…');
      try {
        const adresa = await posaljiSliku(f);
        skriveno.value = adresa;
        pregled.src = adresa;
        pregled.hidden = false;
        skini.hidden = false;
        javi(glasnik, 'Slika poslata.', true);
      } catch (g) {
        javi(glasnik, porukaGreske(g));
      }
      ulaz.value = '';
    });

    skini.addEventListener('click', () => {
      skriveno.value = '';
      pregled.hidden = true;
      skini.hidden = true;
    });
  });
}

async function crud(kljuc) {
  const cfg = SEKCIJE[kljuc];
  sadrzaj.innerHTML = '';

  const okvir = el(`<div class="admin-mreza">
    <div class="admin-forma">
      <h3 id="naslovForme">Novi unos</h3>
      <form id="forma" class="form"></form>
      <p class="glas" id="glasForme" hidden></p>
    </div>
    <div class="admin-spisak">
      <h3>Postojeće <span class="broj" id="broj"></span></h3>
      <div id="spisak"></div>
    </div>
  </div>`);
  sadrzaj.appendChild(okvir);

  const forma = okvir.querySelector('#forma');
  const glasnik = okvir.querySelector('#glasForme');
  const spisak = okvir.querySelector('#spisak');
  const naslovForme = okvir.querySelector('#naslovForme');
  const broj = okvir.querySelector('#broj');
  let mijenjam = null;

  function crtajFormu(red) {
    mijenjam = red;
    naslovForme.textContent = red ? 'Izmjena' : 'Novi unos';
    forma.innerHTML = cfg.polja.map(p => poljeHTML(p, red ? red[p.k] : '')).join('') +
      `<div class="forma-dno">
         <button type="submit" class="btn btn-fill">${red ? 'Sačuvaj' : 'Dodaj'}</button>
         ${red ? '<button type="button" class="btn btn-line" id="odustani">Odustani</button>' : ''}
       </div>`;
    vezisliku(forma, glasnik);
    const odustani = forma.querySelector('#odustani');
    if (odustani) odustani.addEventListener('click', () => { crtajFormu(null); javi(glasnik, ''); });
  }

  async function ucitaj() {
    let data;
    try {
      data = await izBaze(cfg.tabela);
    } catch (greska) {
      spisak.innerHTML = `<p class="glas lose">${tekst(porukaGreske(greska))}</p>`;
      return;
    }

    broj.textContent = data.length;
    if (!data.length) { spisak.innerHTML = '<p class="prazno">Još nema unosa.</p>'; return; }

    spisak.innerHTML = '';
    data.forEach(red => {
      const stavka = el(`<div class="admin-stavka">
        ${red.slika ? `<img src="${tekst(red.slika)}" alt="">` : ''}
        <div class="admin-tekst">
          <b>${tekst(cfg.glavno(red))}</b>
          <span>${tekst(cfg.uz(red))}</span>
        </div>
        <div class="admin-radnje">
          <button class="btn btn-line mali izmijeni">Izmijeni</button>
          <button class="btn btn-line mali obrisi">Obriši</button>
        </div>
      </div>`);

      stavka.querySelector('.izmijeni').addEventListener('click', () => {
        crtajFormu(red);
        okvir.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      stavka.querySelector('.obrisi').addEventListener('click', async () => {
        if (!confirm('Obrisati „' + cfg.glavno(red) + '“?')) return;
        try {
          await obrisiIzBaze(cfg.tabela, red.id);
        } catch (greska) {
          javi(glasnik, porukaGreske(greska));
          return;
        }
        javi(glasnik, 'Obrisano.', true);
        if (mijenjam && mijenjam.id === red.id) crtajFormu(null);
        ucitaj();
      });

      spisak.appendChild(stavka);
    });
  }

  forma.addEventListener('submit', async e => {
    e.preventDefault();
    const podaci = {};
    cfg.polja.forEach(p => {
      let v = forma.elements[p.k].value;
      if (p.t === 'number') v = v === '' ? 0 : Number(v);
      if (v === '' && p.t !== 'text') v = null;
      podaci[p.k] = v;
    });

    try {
      if (mijenjam) await izmijeni(cfg.tabela, mijenjam.id, podaci);
      else await dodaj(cfg.tabela, podaci);
    } catch (greska) {
      javi(glasnik, porukaGreske(greska));
      return;
    }

    javi(glasnik, mijenjam ? 'Sačuvano.' : 'Dodato.', true);
    crtajFormu(null);
    ucitaj();
  });

  crtajFormu(null);
  ucitaj();
}

async function nalozi() {
  sadrzaj.innerHTML = '';
  const okvir = el(`<div class="admin-spisak siroko">
    <h3>Registrovani nalozi <span class="broj" id="broj"></span></h3>
    <p class="glas" id="glasN" hidden></p>
    <div id="spisak"></div>
  </div>`);
  sadrzaj.appendChild(okvir);

  const spisak = okvir.querySelector('#spisak');
  const glasnik = okvir.querySelector('#glasN');
  const broj = okvir.querySelector('#broj');

  let data;
  try {
    data = await profili();
  } catch (greska) {
    javi(glasnik, porukaGreske(greska));
    return;
  }

  broj.textContent = data.length;
  if (!data.length) { spisak.innerHTML = '<p class="prazno">Još niko nije napravio nalog.</p>'; return; }

  data.forEach(p => {
    const kad = p.napravljeno ? new Date(p.napravljeno).toLocaleDateString('sr-Latn') : '';
    const stavka = el(`<div class="admin-stavka">
      <div class="admin-tekst">
        <b>${tekst(p.email || 'bez adrese')}</b>
        <span>${tekst([p.ime, kad].filter(Boolean).join(' · '))}</span>
      </div>
      <div class="admin-radnje">
        <span class="znak ${p.uloga === 'admin' ? 'admin' : ''}">${p.uloga}</span>
        <select class="uloga-izbor">
          <option value="korisnik"${p.uloga === 'korisnik' ? ' selected' : ''}>Korisnik</option>
          <option value="nastavnik"${p.uloga === 'nastavnik' ? ' selected' : ''}>Nastavnik</option>
          <option value="admin"${p.uloga === 'admin' ? ' selected' : ''}>Admin</option>
        </select>
      </div>
    </div>`);

    stavka.querySelector('.uloga-izbor').addEventListener('change', async ev => {
      try {
        await postaviUlogu(p.id, ev.target.value);
      } catch (greska) {
        javi(glasnik, porukaGreske(greska));
        return;
      }
      nalozi();
    });

    spisak.appendChild(stavka);
  });
}

async function poslateSlike() {
  sadrzaj.innerHTML = '';
  const okvir = el(`<div class="admin-spisak siroko">
    <h3>Slike koje su poslali učenici <span class="broj" id="broj"></span></h3>
    <p class="glas" id="glasP" hidden></p>
    <div id="spisak"></div>
  </div>`);
  sadrzaj.appendChild(okvir);

  const spisak = okvir.querySelector('#spisak');
  const glasnik = okvir.querySelector('#glasP');
  const broj = okvir.querySelector('#broj');

  let data;
  try {
    data = await prijedlozi();
  } catch (greska) {
    javi(glasnik, porukaGreske(greska));
    return;
  }

  broj.textContent = data.length;
  if (!data.length) { spisak.innerHTML = '<p class="prazno">Još nema poslatih slika.</p>'; return; }

  spisak.innerHTML = '';
  data.forEach(red => {
    const kad = red.napravljeno ? new Date(red.napravljeno).toLocaleDateString('sr-Latn') : '';
    const stavka = el(`<div class="admin-stavka">
      <img src="${tekst(red.slika)}" alt="">
      <div class="admin-tekst">
        <b>${red.vidjeno ? '' : '<em class="adm-svjeze">Novo</em> '}${tekst(red.naslov)}</b>
        <span>${tekst([red.posiljalac || red.email, kad].filter(Boolean).join(' · '))}</span>
        ${red.opis ? `<span>${tekst(red.opis)}</span>` : ''}
      </div>
      <div class="admin-radnje">
        <button class="btn btn-line mali uKutak">U kutak</button>
        <button class="btn btn-line mali obrisi">Obriši</button>
      </div>
    </div>`);

    stavka.querySelector('.uKutak').addEventListener('click', async () => {
      try {
        await dodaj('kutak', {
          naslov: red.naslov,
          kategorija: 'Poslali učenici',
          opis: red.opis || '',
          slika: red.slika
        });
        await obrisiPrijedlog(red.id);
      } catch (greska) {
        javi(glasnik, porukaGreske(greska));
        return;
      }
      javi(glasnik, 'Prebačeno u kutak učenika.', true);
      poslateSlike();
    });

    stavka.querySelector('.obrisi').addEventListener('click', async () => {
      if (!confirm('Obrisati „' + red.naslov + '“?')) return;
      try {
        await obrisiPrijedlog(red.id);
      } catch (greska) {
        javi(glasnik, porukaGreske(greska));
        return;
      }
      javi(glasnik, 'Obrisano.', true);
      poslateSlike();
    });

    spisak.appendChild(stavka);
  });

  if (data.some(r => !r.vidjeno)) pregledano('prijedlozi').then(osvjeziNovo).catch(() => {});
}

const OPISI_FIRME = [
  ['pravni_oblik', 'Pravni oblik'],
  ['osnovana', 'Osnovana'],
  ['pib', 'PIB'],
  ['sjediste', 'Sjedište'],
  ['djelatnost', 'Djelatnost'],
  ['zaposlenih', 'Zaposlenih'],
  ['sajt', 'Internet stranica'],
  ['direktor', 'Direktor'],
  ['kontakt', 'Osoba za kontakt'],
  ['funkcija', 'Funkcija'],
  ['telefon', 'Telefon'],
  ['email', 'E-pošta'],
  ['saradnja', 'Saradnja'],
  ['mjesta', 'Broj učenika'],
  ['programi', 'Programi'],
  ['period', 'Kada'],
  ['o_firmi', 'O firmi'],
  ['napomena', 'Napomena']
];

async function poslateFirme() {
  sadrzaj.innerHTML = '';
  const okvir = el(`<div class="admin-spisak siroko">
    <h3>Upitnici od firmi <span class="broj" id="broj"></span></h3>
    <p class="glas" id="glasF" hidden></p>
    <div id="spisak"></div>
  </div>`);
  sadrzaj.appendChild(okvir);

  const spisak = okvir.querySelector('#spisak');
  const glasnik = okvir.querySelector('#glasF');
  const broj = okvir.querySelector('#broj');

  let data;
  try {
    data = await firme();
  } catch (greska) {
    javi(glasnik, porukaGreske(greska));
    return;
  }

  broj.textContent = data.length;
  if (!data.length) { spisak.innerHTML = '<p class="prazno">Još nijedna firma nije poslala upitnik.</p>'; return; }

  data.forEach(f => {
    const kad = f.napravljeno ? new Date(f.napravljeno).toLocaleString('sr-Latn', { dateStyle: 'medium', timeStyle: 'short' }) : '';
    const redovi = OPISI_FIRME.filter(([k]) => f[k]).map(([k, o]) => {
      let v = tekst(f[k]);
      if (k === 'email') v = `<a href="mailto:${v}">${v}</a>`;
      if (k === 'telefon') v = `<a href="tel:${v.replace(/[^+0-9]/g, '')}">${v}</a>`;
      if (k === 'sajt') v = `<a href="${/^https?:/i.test(f.sajt) ? '' : 'https://'}${v}" target="_blank" rel="noopener">${v}</a>`;
      return `<dt>${o}</dt><dd>${v}</dd>`;
    }).join('');

    const stavka = el(`<details class="adm-firma"${f.vidjeno ? '' : ' open'}>
      <summary>
        <span class="admin-tekst">
          <b>${f.vidjeno ? '' : '<em class="adm-svjeze">Novo</em> '}${tekst(f.naziv)}</b>
          <span>${tekst([f.saradnja, f.kontakt, kad].filter(Boolean).join(' · '))}</span>
        </span>
      </summary>
      <dl>${redovi}</dl>
      <div class="admin-radnje">
        <button class="btn btn-line mali uPoslodavce">Dodaj među poslodavce</button>
        <button class="btn btn-line mali obrisi">Obriši</button>
      </div>
    </details>`);

    stavka.querySelector('.uPoslodavce').addEventListener('click', async () => {
      try {
        await dodaj('poslodavci', {
          naziv: f.naziv,
          oznaka: f.saradnja || '',
          opis: [f.djelatnost, f.sjediste].filter(Boolean).join(', ')
        });
      } catch (greska) {
        javi(glasnik, porukaGreske(greska));
        return;
      }
      javi(glasnik, f.naziv + ' je dodata među poslodavce.', true);
    });

    stavka.querySelector('.obrisi').addEventListener('click', async () => {
      if (!confirm('Obrisati upitnik firme „' + f.naziv + '“?')) return;
      try {
        await obrisiFirmu(f.id);
      } catch (greska) {
        javi(glasnik, porukaGreske(greska));
        return;
      }
      poslateFirme();
    });

    spisak.appendChild(stavka);
  });

  if (data.some(f => !f.vidjeno)) pregledano('firme').then(osvjeziNovo).catch(() => {});
}

const ukupnoNovo = document.getElementById('novo-ukupno');
const naslovStrane = document.title;

async function osvjeziNovo() {
  let n;
  try {
    n = await novo();
  } catch (g) {
    return;
  }

  Object.entries(n).forEach(([kljuc, broj]) => {
    const z = tabovi.querySelector('[data-novo="' + kljuc + '"]');
    if (!z) return;
    z.textContent = broj > 99 ? '99+' : broj;
    z.hidden = !broj;
  });

  const svega = n.firme + n.prijedlozi;
  ukupnoNovo.hidden = !svega;
  ukupnoNovo.querySelector('span').textContent = padez(svega, 'nova poruka', 'nove poruke', 'novih poruka');
  ukupnoNovo.onclick = () => prikazi(n.firme ? 'firme' : 'prijedlozi');
  document.title = svega ? '(' + svega + ') ' + naslovStrane : naslovStrane;
}

async function moodleDokumenti() {
  sadrzaj.innerHTML = '';
  const okvir = el(`<div class="admin-mreza">
    <div class="admin-forma">
      <h3>Novi dokument</h3>
      <form id="formaDok" class="form">
        <label class="f"><span>Naziv</span>
          <input type="text" name="naslov" maxlength="160" required></label>
        <label class="f"><span>Opis</span>
          <textarea name="opis" rows="4"></textarea></label>
        <label class="f"><span>Razred</span>
          <select name="razred"></select></label>
        <label class="f"><span>Predmet</span>
          <select name="predmet"></select></label>
        <label class="f" id="poljeRucno" hidden><span>Upiši predmet</span>
          <input type="text" name="predmetRucno" maxlength="120"></label>
        <label class="f"><span>Rubrika</span>
          <select name="rubrika"></select></label>
        <label class="f"><span>Datoteka</span>
          <input type="file" name="datoteka" required>
          <small>PDF, Word, Excel, PowerPoint, tekst, slika ili zip, najviše 18 MB</small></label>
        <label class="f"><span>Ko vidi dokument</span>
          <select name="vidljivost">
            <option value="svi">Svi, i učenici i nastavnici</option>
            <option value="nastavnici">Samo nastavnici škole</option>
          </select></label>
        <div class="forma-dno">
          <button type="submit" class="btn btn-fill">Postavi</button>
        </div>
      </form>
      <p class="glas" id="glasDok" hidden></p>
    </div>
    <div class="admin-spisak">
      <h3>Postavljeni <span class="broj" id="brojDok"></span></h3>
      <div id="spisakDok"></div>
    </div>
  </div>`);
  sadrzaj.appendChild(okvir);

  const forma = okvir.querySelector('#formaDok');
  const glasnik = okvir.querySelector('#glasDok');
  const spisak = okvir.querySelector('#spisakDok');
  const broj = okvir.querySelector('#brojDok');
  const izbor = forma.elements.rubrika;
  const izborRazreda = forma.elements.razred;
  const izborPredmeta = forma.elements.predmet;
  const poljeRucno = okvir.querySelector('#poljeRucno');

  function napuniPredmete() {
    const spisakPredmeta = PREDMETI[izborRazreda.value] || [];
    izborPredmeta.textContent = '';
    if (spisakPredmeta.length) izborPredmeta.add(new Option('Izaberi predmet', ''));
    spisakPredmeta.forEach(p => izborPredmeta.add(new Option(p, p)));
    izborPredmeta.add(new Option(RUCNO, RUCNO));
    if (!spisakPredmeta.length) izborPredmeta.value = RUCNO;
    poljeRucno.hidden = izborPredmeta.value !== RUCNO;
  }

  izborRazreda.add(new Option(SVI_RAZREDI, SVI_RAZREDI));
  RAZREDI.forEach(r => izborRazreda.add(new Option(r, r)));
  izborRazreda.addEventListener('change', napuniPredmete);
  izborPredmeta.addEventListener('change', () => {
    poljeRucno.hidden = izborPredmeta.value !== RUCNO;
  });
  napuniPredmete();

  async function ucitaj() {
    let odgovor;
    try {
      odgovor = await dokumenti();
    } catch (greska) {
      spisak.innerHTML = `<p class="glas lose">${tekst(porukaGreske(greska))}</p>`;
      return;
    }

    if (!izbor.options.length) {
      odgovor.rubrike.forEach(r => izbor.add(new Option(r, r)));
      izbor.value = 'Dokumenta';
    }

    broj.textContent = odgovor.dokumenti.length;
    if (!odgovor.dokumenti.length) {
      spisak.innerHTML = '<p class="prazno">Još nema dokumenata.</p>';
      return;
    }

    spisak.innerHTML = '';
    odgovor.dokumenti.forEach(red => {
      const kad = red.napravljeno ? new Date(red.napravljeno).toLocaleDateString('sr-Latn') : '';
      const stavka = el(`<div class="admin-stavka">
        <div class="admin-tekst">
          <b>${tekst(red.naslov)}${red.zakljucan ? ' 🔒' : ''}</b>
          <span>${tekst([red.rubrika, red.razred, red.predmet, red.postavio, kad].filter(Boolean).join(' · '))}</span>
        </div>
        <div class="admin-radnje">
          <a class="btn btn-line mali" href="/dokument/${red.id}" target="_blank" rel="noopener">Otvori</a>
          <button class="btn btn-line mali kljuc">${red.zakljucan ? 'Otključaj' : 'Zaključaj'}</button>
          <button class="btn btn-line mali obrisi">Obriši</button>
        </div>
      </div>`);

      stavka.querySelector('.kljuc').addEventListener('click', async () => {
        try {
          await izmijeniDokument(red.id, { zakljucan: !red.zakljucan });
        } catch (greska) {
          javi(glasnik, porukaGreske(greska));
          return;
        }
        javi(glasnik, red.zakljucan ? 'Otključano.' : 'Zaključano.', true);
        ucitaj();
      });

      stavka.querySelector('.obrisi').addEventListener('click', async () => {
        if (!confirm('Obrisati „' + red.naslov + '“?')) return;
        try {
          await obrisiDokument(red.id);
        } catch (greska) {
          javi(glasnik, porukaGreske(greska));
          return;
        }
        javi(glasnik, 'Obrisano.', true);
        ucitaj();
      });

      spisak.appendChild(stavka);
    });
  }

  forma.addEventListener('submit', async e => {
    e.preventDefault();
    const fajl = forma.elements.datoteka.files[0];
    if (!fajl) { javi(glasnik, 'Izaberi datoteku.'); return; }

    const dugme = forma.querySelector('button[type=submit]');
    dugme.disabled = true;
    javi(glasnik, 'Šaljem…');

    try {
      const izabran = izborPredmeta.value;
      await posaljiDokument(fajl, {
        naslov: forma.elements.naslov.value.trim(),
        opis: forma.elements.opis.value.trim(),
        predmet: izabran === RUCNO ? forma.elements.predmetRucno.value.trim() : izabran,
        razred: izborRazreda.value === SVI_RAZREDI ? '' : izborRazreda.value,
        rubrika: forma.elements.rubrika.value,
        zakljucan: forma.elements.vidljivost.value === 'nastavnici'
      });
    } catch (greska) {
      dugme.disabled = false;
      javi(glasnik, porukaGreske(greska));
      return;
    }

    dugme.disabled = false;
    const rubrikaBila = forma.elements.rubrika.value;
    forma.reset();
    forma.elements.rubrika.value = rubrikaBila;
    javi(glasnik, 'Dokument je postavljen.', true);
    ucitaj();
  });

  ucitaj();
}

function znacka(kljuc, broj) {
  const z = tabovi.querySelector('[data-broj="' + kljuc + '"]');
  if (!z) return;
  z.textContent = broj;
  z.hidden = !broj;
}

function padez(broj, jedan, dva, pet) {
  const d = broj % 10;
  const s = broj % 100;
  if (d === 1 && s !== 11) return broj + ' ' + jedan;
  if (d >= 2 && d <= 4 && (s < 12 || s > 14)) return broj + ' ' + dva;
  return broj + ' ' + pet;
}

async function pocetna() {
  sadrzaj.innerHTML = '';
  let b;
  try {
    b = await pregled();
  } catch (greska) {
    sadrzaj.innerHTML = `<p class="glas lose">${tekst(porukaGreske(greska))}</p>`;
    return;
  }

  znacka('moodle', b.zakljucanih_kurseva);

  const plocice = [
    ['moodle', b.zakljucanih_kurseva, 'zaključanih kurseva', 'od ' + b.kurseva + ' u Moodle-u'],
    ['dokumenti', b.dokumenti, 'dokumenata od nastavnika', b.zakljucanih_dokumenata + ' samo za nastavnike'],
    ['prijedlozi', b.prijedlozi, 'slika čeka pregled', b.prijedlozi ? 'Pogledaj i prebaci u kutak' : 'Sve je pregledano'],
    ['firme', b.firme, 'upitnika od firmi', b.firme ? 'Pogledaj ko se javio' : 'Još niko nije pisao'],
    ['novosti', b.novosti, 'novosti', 'na strani Novosti'],
    ['nalozi', b.nalozi, 'naloga', padez(b.nastavnika, 'nastavnik', 'nastavnika', 'nastavnika')],
    ['nastavnici', b.zaposlenih, 'zaposlenih', 'na spisku osoblja'],
    ['kutak', b.kutak, 'slika u kutku', 'galerija učenika'],
    ['poslodavci', b.poslodavci, 'poslodavaca', 'partneri za praksu']
  ];

  const mreza = el('<div class="adm-plocice"></div>');
  plocice.forEach(([kljuc, broj, ime, uz], i) => {
    const p = el(`<button type="button" class="adm-plocica${i === 0 ? ' glavna' : ''}${(kljuc === 'prijedlozi' || kljuc === 'firme') && broj ? ' ceka' : ''}">
      <b>${broj}</b>
      <span class="ime">${tekst(ime)}</span>
      <span class="uz">${tekst(uz)}</span>
    </button>`);
    p.addEventListener('click', () => prikazi(kljuc));
    mreza.appendChild(p);
  });
  sadrzaj.appendChild(mreza);

  const brzo = el(`<div class="adm-kartica">
    <h3>Brze radnje</h3>
    <div class="adm-brzo">
      <button type="button" class="btn btn-fill" data-idi="novosti">Dodaj novost</button>
      <button type="button" class="btn btn-line" data-idi="dokumenti">Postavi dokument</button>
      <button type="button" class="btn btn-line" data-idi="moodle">Zaključaj kurs</button>
      <a class="btn btn-line" href="moodle.html">Otvori Moodle</a>
    </div>
  </div>`);
  brzo.querySelectorAll('[data-idi]').forEach(d => d.addEventListener('click', () => prikazi(d.dataset.idi)));
  sadrzaj.appendChild(brzo);
}

function bezKvaka(t) {
  return String(t || '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

async function moodleZakljucavanje() {
  sadrzaj.innerHTML = '';
  const okvir = el(`<div class="adm-moodle">
    <div class="adm-kartica">
      <div class="adm-kartica-glava">
        <div>
          <h3>Zaključavanje kurseva</h3>
          <p class="adm-sitno" id="mStanje">Učitavam Moodle…</p>
        </div>
        <label class="adm-trazi">
          <input type="search" id="mTrazi" placeholder="Traži kurs, nastavnika ili odjeljenje" autocomplete="off">
        </label>
      </div>
      <div class="adm-cipovi" id="mDijelovi"></div>
      <div class="adm-cipovi mali" id="mRazredi"></div>
      <div class="adm-cipovi mali" id="mOdjeljenja"></div>
      <div class="adm-grupa" id="mGrupa" hidden>
        <p id="mGrupaIme"></p>
        <div>
          <button type="button" class="btn btn-line mali" id="mSveZ">Zaključaj sve</button>
          <button type="button" class="btn btn-line mali" id="mSveO">Otključaj sve</button>
        </div>
      </div>
      <p class="glas" id="mGlas" hidden></p>
      <div class="adm-kursevi" id="mKursevi"></div>
    </div>
    <div class="adm-kartica">
      <h3>Zaključano sada <span class="broj" id="mBroj"></span></h3>
      <div id="mZakljucani"></div>
    </div>
  </div>`);
  sadrzaj.appendChild(okvir);

  const $ = id => okvir.querySelector('#' + id);
  const glasnik = $('mGlas');

  let arhiva;
  try {
    arhiva = await moodleArhiva();
  } catch (greska) {
    javi(glasnik, porukaGreske(greska));
    return;
  }

  const svi = [];
  const dijelovi = [];
  const skupi = (grana, put, u) => {
    (grana.k || []).forEach(k => { k.put = put; u.push(k); });
    (grana.p || []).forEach(p => skupi(p, put.concat(p.n), u));
  };
  arhiva.zbirke.forEach(z => dijelovi.push({ grana: z, ime: z.n }));
  arhiva.godine.forEach(g => dijelovi.push({ grana: g, ime: g.n }));
  dijelovi.forEach(d => {
    d.kursevi = [];
    skupi(d.grana, [d.ime], d.kursevi);
    svi.push(...d.kursevi);
  });

  let dio = dijelovi.find(d => /\d{4}/.test(d.ime)) || dijelovi[0];
  let razred = null;
  let odjeljenje = null;

  function stanje() {
    const z = svi.filter(k => k.z);
    $('mStanje').textContent = padez(z.length, 'kurs zaključan', 'kursa zaključana', 'kurseva zaključano') + ' od ' + svi.length + '.';
    $('mBroj').textContent = z.length;
    znacka('moodle', z.length);

    const spisak = $('mZakljucani');
    spisak.innerHTML = '';
    if (!z.length) {
      spisak.innerHTML = '<p class="prazno">Ništa nije zaključano, sve u Moodle-u je otvoreno za sve.</p>';
      return;
    }
    z.forEach(k => spisak.appendChild(redKursa(k, true)));
  }

  async function postavi(kursevi, zakljucan) {
    const promjena = kursevi.filter(k => Boolean(k.z) !== zakljucan);
    if (!promjena.length) return;
    try {
      await zakljucajKurseve(promjena.map(k => k.i), zakljucan);
    } catch (greska) {
      javi(glasnik, porukaGreske(greska));
      return;
    }
    promjena.forEach(k => { k.z = zakljucan ? 1 : 0; });
    javi(glasnik, (zakljucan ? 'Zaključano: ' : 'Otključano: ') + padez(promjena.length, 'kurs', 'kursa', 'kurseva') + '.', true);
    crtajKurseve();
    stanje();
  }

  function redKursa(k, saPutem) {
    const red = el(`<div class="adm-kurs${k.z ? ' zakljucan' : ''}">
      <div class="admin-tekst">
        ${saPutem ? `<span class="adm-put">${tekst(k.put.join(' · '))}</span>` : ''}
        <b>${tekst(k.n)}</b>
        <span>${tekst((k.t || []).join(', ') || 'Nastavnik nije upisan')}</span>
      </div>
      <label class="adm-prekidac">
        <span>${k.z ? 'Zaključan' : 'Otvoren'}</span>
        <input type="checkbox" role="switch"${k.z ? ' checked' : ''}>
        <i></i>
      </label>
    </div>`);
    red.querySelector('input').addEventListener('change', e => postavi([k], e.target.checked));
    return red;
  }

  function cipovi(gdje, spisak, aktivan, ime, posao) {
    gdje.innerHTML = '';
    gdje.hidden = spisak.length < 2;
    spisak.forEach(x => {
      const b = el(`<button type="button"${x === aktivan ? ' class="on"' : ''}></button>`);
      b.textContent = ime(x);
      b.addEventListener('click', () => posao(x));
      gdje.appendChild(b);
    });
  }

  function trenutni() {
    const upit = bezKvaka($('mTrazi').value.trim());
    if (upit.length >= 2) {
      const rijeci = upit.split(/\s+/);
      return {
        ime: 'Pretraga',
        kursevi: svi.filter(k => {
          const t = bezKvaka([k.n, (k.t || []).join(' '), k.put.join(' ')].join(' '));
          return rijeci.every(r => t.includes(r));
        }),
        put: true
      };
    }
    if (odjeljenje && odjeljenje.i !== 'sve') return { ime: [dio.ime, razred.n, odjeljenje.n].join(' · '), kursevi: odjeljenje.u };
    if (razred) return { ime: [dio.ime, razred.n].join(' · '), kursevi: razred.u };
    return { ime: dio.ime, kursevi: dio.kursevi };
  }

  function crtajKurseve() {
    const trazi = $('mTrazi').value.trim().length >= 2;
    cipovi($('mDijelovi'), trazi ? [] : dijelovi, dio, d => d.ime, d => {
      dio = d;
      razred = null;
      odjeljenje = null;
      crtajKurseve();
    });
    $('mDijelovi').hidden = trazi;

    const razredi = trazi ? [] : (dio.grana.p || []).map(p => {
      const u = [];
      skupi(p, [dio.ime, p.n], u);
      return { ...p, u };
    });
    if (razredi.length && (!razred || !razredi.some(x => x.i === razred.i))) razred = razredi[0];
    if (!razredi.length) razred = null;
    cipovi($('mRazredi'), razredi, razredi.find(x => razred && x.i === razred.i), x => x.n, x => {
      razred = x;
      odjeljenje = null;
      crtajKurseve();
    });

    const odjeljenja = razred && razred.p ? [{ i: 'sve', n: 'Cijeli razred', u: razred.u }].concat(razred.p.map(p => {
      const u = [];
      skupi(p, [dio.ime, razred.n, p.n], u);
      return { ...p, u };
    })) : [];
    if (odjeljenja.length && (!odjeljenje || !odjeljenja.some(x => x.i === odjeljenje.i))) odjeljenje = odjeljenja[0];
    if (!odjeljenja.length) odjeljenje = null;
    cipovi($('mOdjeljenja'), odjeljenja, odjeljenja.find(x => odjeljenje && x.i === odjeljenje.i), x => x.n, x => {
      odjeljenje = x;
      crtajKurseve();
    });

    const t = trenutni();
    const kursevi = t.kursevi;
    $('mGrupa').hidden = !kursevi.length;
    const zakljucanih = kursevi.filter(k => k.z).length;
    $('mGrupaIme').innerHTML = `<b>${tekst(t.ime)}</b> · ${padez(kursevi.length, 'kurs', 'kursa', 'kurseva')}, zaključano ${zakljucanih}`;
    $('mSveZ').disabled = zakljucanih === kursevi.length;
    $('mSveO').disabled = !zakljucanih;
    $('mSveZ').onclick = () => postavi(kursevi, true);
    $('mSveO').onclick = () => postavi(kursevi, false);

    const spisak = $('mKursevi');
    spisak.innerHTML = '';
    if (!kursevi.length) {
      spisak.innerHTML = '<p class="prazno">Ništa ne odgovara pretrazi.</p>';
      return;
    }
    kursevi.slice(0, 200).forEach(k => spisak.appendChild(redKursa(k, t.put)));
    if (kursevi.length > 200) spisak.appendChild(el('<p class="prazno">Prikazano prvih 200, suzi pretragu.</p>'));
  }

  let cekanje = null;
  $('mTrazi').addEventListener('input', () => {
    clearTimeout(cekanje);
    cekanje = setTimeout(crtajKurseve, 120);
  });

  crtajKurseve();
  stanje();
}

function prikazi(kljuc) {
  [...tabovi.children].forEach(d => {
    const on = d.dataset.tab === kljuc;
    d.classList.toggle('on', on);
    if (on) d.setAttribute('aria-current', 'page');
    else d.removeAttribute('aria-current');
  });
  naslovTaba.textContent = TABOVI[kljuc][0];
  opisTaba.textContent = TABOVI[kljuc][1];
  history.replaceState(null, '', '#' + kljuc);
  if (kljuc === 'pregled') pocetna();
  else if (kljuc === 'moodle') moodleZakljucavanje();
  else if (kljuc === 'nalozi') nalozi();
  else if (kljuc === 'prijedlozi') poslateSlike();
  else if (kljuc === 'firme') poslateFirme();
  else if (kljuc === 'dokumenti') moodleDokumenti();
  else crud(kljuc);
}

async function kreni() {
  if (!(await imaBazu())) {
    strazar.hidden = false;
    strazar.innerHTML = '<h2>Baza nije podešena</h2><p>Server radi, ali nema veze sa bazom. U Railway-u treba dodati Postgres i promjenljivu <code>DATABASE_URL</code>.</p>';
    return;
  }

  const p = await mojProfil();
  const admin = await jeAdmin();
  const nastavnik = Boolean(p && p.uloga === 'nastavnik');

  if (!admin && !nastavnik) {
    strazar.hidden = false;
    strazar.innerHTML = p
      ? '<h2>Nemaš pristup</h2><p>Prijavljen si kao ' + tekst(p.email) + ', ali taj nalog nije ni admin ni nastavnik.</p><p><a class="btn btn-fill" href="index.html">Nazad na sajt</a></p>'
      : '<h2>Prijavi se</h2><p>Panel je dostupan upravi i nastavnicima škole.</p><p><a class="btn btn-fill" href="prijava.html">Prijava</a></p>';
    return;
  }

  pozdrav.textContent = p.ime || p.email;
  document.getElementById('uloga').textContent = p.ime ? p.email : (admin ? 'Admin' : 'Nastavnik');
  document.getElementById('inicijal').textContent = (p.ime || p.email).trim().charAt(0).toUpperCase();
  panel.hidden = false;

  document.getElementById('odjava').addEventListener('click', async () => {
    await odjaviSe();
    location.href = 'index.html';
  });

  [...tabovi.children].forEach(d => {
    if (!admin && d.dataset.tab !== 'dokumenti') {
      d.hidden = true;
      return;
    }
    d.addEventListener('click', () => prikazi(d.dataset.tab));
  });

  const trazen = location.hash.slice(1);
  if (admin) {
    prikazi(TABOVI[trazen] ? trazen : 'pregled');
    if (trazen && trazen !== 'pregled') pregled().then(b => {
      znacka('moodle', b.zakljucanih_kurseva);
    }).catch(() => {});
    osvjeziNovo();
    setInterval(osvjeziNovo, 30000);
  } else {
    prikazi('dokumenti');
  }
}

kreni();
