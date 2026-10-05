const IZVOR = 'https://elektropg.online/ets/';

const ZBIRKE = {
  'Obavještenja': 'obavjestenja',
  'Dokumenta': 'dokumenta',
  'Projekti': 'projekti',
  'Vanredni ispiti': 'vanredni'
};

const OZNAKE = {
  pdf: 'PDF', ppt: 'PPT', doc: 'DOC', xls: 'XLS', slika: 'SLIKA', zip: 'ZIP', kod: 'KOD', txt: 'TXT',
  veza: 'VEZA', forum: 'FORUM', chat: 'ČET', folder: 'FOLDER', zadatak: 'ZADATAK', test: 'TEST',
  strana: 'STRANA', lekcija: 'LEKCIJA', fajl: 'FAJL', natpis: ''
};

const polje = document.getElementById('m-trazi');
const zbirkeEl = document.getElementById('m-zbirke-unutra');
const rezultati = document.getElementById('m-rezultati');
const nadjeno = document.getElementById('m-nadjeno');
const brojNadjenih = document.getElementById('m-broj');
const upitEl = document.getElementById('m-upit');
const godineEl = document.getElementById('m-godine');
const razrediEl = document.getElementById('m-razredi');
const odjeljenjaEl = document.getElementById('m-odjeljenja');
const predmetiEl = document.getElementById('m-predmeti');
const prozor = document.getElementById('m-kurs');
const ostaloEl = document.querySelectorAll('[data-van-pretrage]');

let arhiva = null;
let indeks = [];
const putevi = new Map();
const izbor = new URLSearchParams(location.search);

function el(vrsta, razred, tekst) {
  const e = document.createElement(vrsta);
  if (razred) e.className = razred;
  if (tekst != null) e.textContent = tekst;
  return e;
}

function bezKvaka(t) {
  return String(t || '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function adresa(u) {
  return /^https?:/.test(u) ? u : IZVOR + u;
}

function materijali(kurs) {
  return (kurs.s || []).flatMap(s => s.a).filter(a => a.u);
}

function padez(broj, jedan, dva, pet) {
  const d = broj % 10;
  const s = broj % 100;
  if (d === 1 && s !== 11) return broj + ' ' + jedan;
  if (d >= 2 && d <= 4 && (s < 12 || s > 14)) return broj + ' ' + dva;
  return broj + ' ' + pet;
}

function znacka(v) {
  const z = el('span', 'm-vrsta', OZNAKE[v] || 'FAJL');
  z.dataset.v = v;
  return z;
}

function vezaMaterijala(a) {
  const veza = el('a', 'm-fajl');
  veza.href = adresa(a.u);
  veza.target = '_blank';
  veza.rel = 'noopener';
  veza.appendChild(znacka(a.v));
  const ime = el('span', 'm-fajl-ime', a.n);
  veza.appendChild(ime);
  return veza;
}

function svakiKurs(grana, put, posao) {
  (grana.k || []).forEach(k => posao(k, put));
  (grana.p || []).forEach(p => svakiKurs(p, put.concat(p.n), posao));
}

function napraviIndeks() {
  arhiva.zbirke.forEach(z => svakiKurs(z, [z.n], (k, put) => putevi.set(k.i, put)));
  arhiva.godine.forEach(g => svakiKurs(g, [g.n], (k, put) => putevi.set(k.i, put)));

  putevi.forEach((put, id) => {
    const kurs = nadjiKurs(id);
    indeks.push({
      kurs,
      put,
      tekst: bezKvaka([kurs.n, (kurs.t || []).join(' '), put.join(' ')].join(' '))
    });
  });
}

const kursevi = new Map();

function nadjiKurs(id) {
  if (!kursevi.size) {
    const upisi = g => {
      (g.k || []).forEach(k => kursevi.set(k.i, k));
      (g.p || []).forEach(upisi);
    };
    arhiva.zbirke.forEach(upisi);
    arhiva.godine.forEach(upisi);
  }
  return kursevi.get(id);
}

function otvoriKurs(kurs) {
  const put = putevi.get(kurs.i) || [];
  prozor.querySelector('#m-kurs-put').textContent = put.join(' · ');
  prozor.querySelector('#m-kurs-ime').textContent = kurs.n;
  const ljudi = prozor.querySelector('#m-kurs-ljudi');
  ljudi.textContent = kurs.t ? 'Predaje: ' + kurs.t.join(', ') : '';
  ljudi.hidden = !kurs.t;

  const izvor = prozor.querySelector('#m-kurs-izvor');
  izvor.href = IZVOR + 'course/view.php?id=' + kurs.i;

  const tijelo = prozor.querySelector('#m-kurs-tijelo');
  tijelo.textContent = '';

  if (!kurs.s) {
    tijelo.appendChild(el('p', 'm-zatvoren',
      'Sadržaj ovog kursa je vidljiv samo upisanim učenicima i nastavnicima. Otvara se u Moodle-u, uz prijavu.'));
  } else if (!kurs.s.some(s => s.a.length || s.o)) {
    tijelo.appendChild(el('p', 'm-zatvoren', 'U ovom kursu još nema materijala.'));
  } else {
    kurs.s.forEach(s => {
      const dio = el('section', 'm-dio');
      if (s.n) dio.appendChild(el('h3', null, s.n));
      if (s.o) dio.appendChild(el('p', 'm-dio-opis', s.o));
      const spisak = el('div', 'm-fajlovi');
      s.a.forEach(a => {
        if (!a.u) {
          spisak.appendChild(el('p', 'm-natpis', a.n));
          return;
        }
        const red = vezaMaterijala(a);
        if (a.o) red.appendChild(el('span', 'm-fajl-opis', a.o));
        spisak.appendChild(red);
      });
      dio.appendChild(spisak);
      tijelo.appendChild(dio);
    });
  }

  izbor.set('kurs', kurs.i);
  zapamti();
  if (!prozor.open) prozor.showModal();
  tijelo.scrollTop = 0;
}

prozor.addEventListener('close', () => {
  izbor.delete('kurs');
  zapamti();
});

prozor.addEventListener('click', e => {
  if (e.target === prozor || e.target.closest('[data-zatvori]')) prozor.close();
});

function zapamti() {
  const rep = izbor.toString();
  history.replaceState(null, '', location.pathname + (rep ? '?' + rep : '') + location.hash);
}

function karta(kurs) {
  const fajlovi = materijali(kurs);
  const sam = fajlovi.length === 1 && fajlovi[0];
  const k = el(sam ? 'a' : 'button', 'm-karta');

  if (sam) {
    k.href = adresa(sam.u);
    k.target = '_blank';
    k.rel = 'noopener';
  } else {
    k.type = 'button';
    k.addEventListener('click', () => otvoriKurs(kurs));
  }

  const gore = el('div', 'm-karta-gore');
  gore.appendChild(el('h3', null, kurs.n));
  if (sam) gore.appendChild(znacka(sam.v));
  k.appendChild(gore);

  if (sam) {
    k.appendChild(el('p', 'm-karta-uz', sam.n));
  } else if (fajlovi.length) {
    const ul = el('ul', 'm-karta-spisak');
    fajlovi.slice(0, 3).forEach(a => {
      const li = el('li');
      li.appendChild(znacka(a.v));
      li.appendChild(el('span', null, a.n));
      ul.appendChild(li);
    });
    k.appendChild(ul);
  } else {
    k.appendChild(el('p', 'm-karta-uz', kurs.s ? 'Još nema materijala.' : 'Otvara se uz prijavu.'));
  }

  const dno = el('p', 'm-karta-dno');
  dno.appendChild(el('span', null, fajlovi.length ? padez(fajlovi.length, 'materijal', 'materijala', 'materijala') : ''));
  dno.appendChild(el('b', null, sam ? 'Otvori ↗' : 'Pogledaj →'));
  k.appendChild(dno);
  return k;
}

function crtajZbirke() {
  arhiva.zbirke.forEach((z, i) => {
    const dio = el('section', 'm-zbirka' + (i === 0 ? ' m-prva' : ''));
    dio.id = ZBIRKE[z.n] || '';

    const glava = el('header', 'm-zbirka-glava');
    const naslov = el('h2');
    const rijeci = z.n.split(' ');
    naslov.append(rijeci[0] + (rijeci.length > 1 ? ' ' : ''));
    if (rijeci.length > 1) naslov.appendChild(el('span', 'it', rijeci.slice(1).join(' ')));
    glava.appendChild(naslov);

    let ukupno = 0;
    let fajlova = 0;
    svakiKurs(z, [], k => { ukupno++; fajlova += materijali(k).length; });
    glava.appendChild(el('p', 'm-zbirka-broj',
      padez(ukupno, 'kurs', 'kursa', 'kurseva') + ' · ' + padez(fajlova, 'materijal', 'materijala', 'materijala')));
    dio.appendChild(glava);

    const mreza = el('div', 'm-karte');
    (z.k || []).forEach(k => mreza.appendChild(karta(k)));
    dio.appendChild(mreza);

    (z.p || []).forEach(p => {
      dio.appendChild(el('h3', 'm-podnaslov', p.n));
      const podmreza = el('div', 'm-karte');
      svakiKurs(p, [], k => podmreza.appendChild(karta(k)));
      dio.appendChild(podmreza);
    });

    zbirkeEl.appendChild(dio);
  });
}

function dugme(tekst, aktivno, posao) {
  const b = el('button', aktivno ? 'on' : '', tekst);
  b.type = 'button';
  b.setAttribute('aria-pressed', String(aktivno));
  b.addEventListener('click', posao);
  return b;
}

function crtajGodine() {
  const g = arhiva.godine.find(x => String(x.i) === izbor.get('godina')) || arhiva.godine[0];
  godineEl.textContent = '';
  arhiva.godine.forEach(x => godineEl.appendChild(dugme(x.n, x === g, () => {
    izbor.set('godina', x.i);
    izbor.delete('razred');
    izbor.delete('odjeljenje');
    zapamti();
    crtajGodine();
  })));

  const r = g.p.find(x => String(x.i) === izbor.get('razred')) || g.p[0];
  razrediEl.textContent = '';
  g.p.forEach(x => {
    const b = dugme('', x === r, () => {
      izbor.set('godina', g.i);
      izbor.set('razred', x.i);
      izbor.delete('odjeljenje');
      zapamti();
      crtajGodine();
    });
    b.appendChild(el('b', null, x.n.split(' ')[0]));
    b.appendChild(el('span', null, 'razred'));
    razrediEl.appendChild(b);
  });

  const grupe = (r.k ? [{ i: 'svi', n: (r.p ? 'Cijeli razred' : r.n), k: r.k }] : []).concat(r.p || []);
  const o = grupe.find(x => String(x.i) === izbor.get('odjeljenje')) || grupe[r.k && r.p ? 1 : 0];

  odjeljenjaEl.textContent = '';
  odjeljenjaEl.hidden = grupe.length < 2;
  grupe.forEach(x => {
    const b = dugme('', x === o, () => {
      izbor.set('godina', g.i);
      izbor.set('razred', r.i);
      izbor.set('odjeljenje', x.i);
      zapamti();
      crtajGodine();
    });
    b.appendChild(el('b', null, x.n));
    b.appendChild(el('span', null, padez((x.k || []).length, 'predmet', 'predmeta', 'predmeta')));
    odjeljenjaEl.appendChild(b);
  });

  crtajPredmete(o ? o.k || [] : [], [g.n, r.n, o && grupe.length > 1 ? o.n : null].filter(Boolean));
}

function redPredmeta(kurs, put) {
  const red = el('article', 'm-predmet');
  const lijevo = el('div', 'm-predmet-tijelo');
  if (put) lijevo.appendChild(el('p', 'm-put', put.join(' · ')));
  lijevo.appendChild(el('h3', null, kurs.n));
  lijevo.appendChild(el('p', 'm-ljudi', kurs.t ? kurs.t.join(', ') : 'Nastavnik nije upisan'));
  red.appendChild(lijevo);

  const fajlovi = materijali(kurs);
  if (kurs.s) {
    const b = el('button', 'm-otvori');
    b.type = 'button';
    b.appendChild(el('b', null, fajlovi.length ? padez(fajlovi.length, 'materijal', 'materijala', 'materijala') : 'Prazno'));
    b.appendChild(el('span', null, 'Pogledaj'));
    b.addEventListener('click', () => otvoriKurs(kurs));
    red.appendChild(b);
  } else {
    const a = el('a', 'm-otvori m-uz-prijavu');
    a.href = IZVOR + 'course/view.php?id=' + kurs.i;
    a.target = '_blank';
    a.rel = 'noopener';
    a.appendChild(el('b', null, 'Uz prijavu'));
    a.appendChild(el('span', null, 'Moodle ↗'));
    red.appendChild(a);
  }
  return red;
}

function crtajPredmete(spisak, put) {
  predmetiEl.textContent = '';
  const glava = el('p', 'm-predmeti-glava');
  glava.appendChild(el('b', null, put.join(' · ')));
  glava.appendChild(el('span', null, padez(spisak.length, 'predmet', 'predmeta', 'predmeta')));
  predmetiEl.appendChild(glava);
  spisak.forEach(k => predmetiEl.appendChild(redPredmeta(k)));
}

function trazi() {
  const upit = bezKvaka(polje.value.trim());
  const radi = upit.length >= 2;
  rezultati.hidden = !radi;
  ostaloEl.forEach(e => { e.hidden = radi; });
  if (!radi) return;

  const rijeci = upit.split(/\s+/);
  const pogodak = t => rijeci.every(r => t.includes(r));
  const predmeti = indeks.filter(x => pogodak(x.tekst));

  const fajlovi = [];
  indeks.forEach(x => {
    materijali(x.kurs).forEach(a => {
      if (fajlovi.length < 400 && pogodak(bezKvaka(a.n + ' ' + x.kurs.n))) fajlovi.push({ a, x });
    });
  });

  upitEl.textContent = '„' + polje.value.trim() + '“';
  brojNadjenih.textContent = padez(predmeti.length, 'kurs', 'kursa', 'kurseva') + ' i '
    + padez(fajlovi.length, 'materijal', 'materijala', 'materijala') + (fajlovi.length >= 400 ? '+' : '');
  nadjeno.textContent = '';

  if (!predmeti.length && !fajlovi.length) {
    nadjeno.appendChild(el('p', 'nista', 'Ništa ne odgovara pretrazi. Probaj ime predmeta, prezime nastavnika ili odjeljenje (npr. S2A).'));
    return;
  }

  if (predmeti.length) {
    nadjeno.appendChild(el('h3', 'm-podnaslov', 'Kursevi i predmeti'));
    const lista = el('div', 'm-predmeti');
    predmeti.slice(0, 80).forEach(x => lista.appendChild(redPredmeta(x.kurs, x.put)));
    if (predmeti.length > 80) lista.appendChild(el('p', 'nista', 'Prikazano prvih 80 — suzi pretragu.'));
    nadjeno.appendChild(lista);
  }

  if (fajlovi.length) {
    nadjeno.appendChild(el('h3', 'm-podnaslov', 'Materijali'));
    const lista = el('div', 'm-fajlovi m-fajlovi-siroko');
    fajlovi.slice(0, 120).forEach(({ a, x }) => {
      const red = vezaMaterijala(a);
      red.appendChild(el('span', 'm-fajl-opis', x.put.concat(x.kurs.n).join(' · ')));
      lista.appendChild(red);
    });
    if (fajlovi.length > 120) lista.appendChild(el('p', 'nista', 'Prikazano prvih 120 — suzi pretragu.'));
    nadjeno.appendChild(lista);
  }
}

let cekanje = null;
polje.addEventListener('input', () => {
  clearTimeout(cekanje);
  cekanje = setTimeout(trazi, 120);
});

(async function kreni() {
  try {
    const odgovor = await fetch('assets/moodle.json');
    arhiva = await odgovor.json();
  } catch (greska) {
    zbirkeEl.appendChild(el('p', 'nista', 'Arhiva Moodle-a se nije učitala. Osvježi stranu.'));
    return;
  }

  napraviIndeks();
  crtajZbirke();
  crtajGodine();

  const vec = Number(izbor.get('kurs'));
  if (vec && nadjiKurs(vec)) otvoriKurs(nadjiKurs(vec));

  if (polje.value.trim()) trazi();

  if (location.hash) {
    const cilj = document.getElementById(location.hash === '#nastavnici' ? 'ucenici' : location.hash.slice(1));
    if (cilj) cilj.scrollIntoView({ behavior: 'instant' });
  }
})();
