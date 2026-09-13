import {
  imaBazu, jeAdmin, mojProfil, porukaGreske, posaljiSliku,
  spisak as izBaze, dodaj, izmijeni, obrisi as obrisiIzBaze, profili, postaviUlogu
} from './baza.js';

const strazar = document.getElementById('strazar');
const panel = document.getElementById('panel');
const tabovi = document.getElementById('tabovi');
const sadrzaj = document.getElementById('sadrzaj');
const pozdrav = document.getElementById('pozdrav');

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
        <b>${tekst(p.email || '—')}</b>
        <span>${tekst([p.ime, kad].filter(Boolean).join(' · '))}</span>
      </div>
      <div class="admin-radnje">
        <span class="znak ${p.uloga === 'admin' ? 'admin' : ''}">${p.uloga}</span>
        <button class="btn btn-line mali prebaci">${p.uloga === 'admin' ? 'Skini admina' : 'Daj admina'}</button>
      </div>
    </div>`);

    stavka.querySelector('.prebaci').addEventListener('click', async () => {
      const nova = p.uloga === 'admin' ? 'korisnik' : 'admin';
      try {
        await postaviUlogu(p.id, nova);
      } catch (greska) {
        javi(glasnik, porukaGreske(greska));
        return;
      }
      nalozi();
    });

    spisak.appendChild(stavka);
  });
}

function prikazi(kljuc) {
  [...tabovi.children].forEach(d => d.classList.toggle('on', d.dataset.tab === kljuc));
  if (kljuc === 'nalozi') nalozi();
  else crud(kljuc);
}

async function kreni() {
  if (!(await imaBazu())) {
    strazar.hidden = false;
    strazar.innerHTML = '<h2>Baza nije podešena</h2><p>Server radi, ali nema veze sa bazom. U Railway-u treba dodati Postgres i promjenljivu <code>DATABASE_URL</code>.</p>';
    return;
  }

  if (!(await jeAdmin())) {
    strazar.hidden = false;
    const p = await mojProfil();
    strazar.innerHTML = p
      ? '<h2>Nemaš pristup</h2><p>Prijavljen si kao ' + tekst(p.email) + ', ali taj nalog nije admin.</p><p><a class="btn btn-fill" href="index.html">Nazad na sajt</a></p>'
      : '<h2>Prijavi se</h2><p>Admin panel je dostupan samo prijavljenom adminu.</p><p><a class="btn btn-fill" href="prijava.html">Prijava</a></p>';
    return;
  }

  const p = await mojProfil();
  pozdrav.textContent = p.email;
  panel.hidden = false;
  [...tabovi.children].forEach(d => d.addEventListener('click', () => prikazi(d.dataset.tab)));
  prikazi('nalozi');
}

kreni();
