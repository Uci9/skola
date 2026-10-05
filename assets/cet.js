import {
  imaBazu, mojProfil, porukaGreske,
  porukeCeta, posaljiPoruku, obrisiPoruku, kazniUCetu
} from './baza.js';

const OSVJEZI_MS = 3000;
const NAJDUZA = 500;
const SATI = [1, 3, 6, 12, 24];

const soba = document.getElementById('cet');
const spisak = document.getElementById('cet-spisak');
const forma = document.getElementById('cet-forma');
const polje = forma.querySelector('input');
const brojac = document.getElementById('cet-brojac');
const skok = document.getElementById('cet-skok');
const zakljucano = document.getElementById('cet-zakljucano');
const glas = document.getElementById('cet-glas');
const obavjestenje = document.getElementById('cet-obavjestenje');
const prozor = document.getElementById('cet-mod');

let poruke = [];
let zadnji = 0;
let naDnu = true;
let nevidjene = 0;
let admin = false;
let biram = null;

function javi(gdje, tekst, dobro) {
  gdje.textContent = tekst || '';
  gdje.hidden = !tekst;
  gdje.classList.toggle('dobro', Boolean(dobro));
  gdje.classList.toggle('lose', Boolean(tekst) && !dobro);
}

function kratko(tekst) {
  javi(obavjestenje, tekst, true);
  setTimeout(() => javi(obavjestenje, ''), 4000);
}

function spoji(stare, nove) {
  if (!nove.length) return stare;
  const vidjene = new Set(stare.map(m => m.id));
  const dodate = nove.filter(m => !vidjene.has(m.id));
  if (!dodate.length) return stare;
  return [...stare, ...dodate].sort((a, b) => a.id - b.id);
}

function vrijeme(iso) {
  const d = new Date(iso);
  return isNaN(d) ? '' : d.toLocaleTimeString('sr-Latn', { hour: '2-digit', minute: '2-digit' });
}

function dan(iso) {
  const d = new Date(iso);
  if (d.toDateString() === new Date().toDateString()) return 'Danas';
  if (d.toDateString() === new Date(Date.now() - 86400000).toDateString()) return 'Juče';
  return d.toLocaleDateString('sr-Latn', { day: 'numeric', month: 'long' });
}

function inicijali(ime) {
  return ime.split(/[\s._-]+/).map(r => r[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function napravi(oznaka, klasa, tekst) {
  const e = document.createElement(oznaka);
  if (klasa) e.className = klasa;
  if (tekst != null) e.textContent = tekst;
  return e;
}

function crtaj() {
  const bioNaDnu = naDnu;
  const pozicija = spisak.scrollTop;
  spisak.textContent = '';

  if (!poruke.length) {
    spisak.appendChild(napravi('p', 'cet-prazno', 'Još niko nije ništa napisao. Počni ti.'));
    return;
  }

  let zadnjiDan = '';
  let zadnjiProfil = null;
  poruke.forEach(m => {
    const d = dan(m.napravljeno);
    const noviDan = d !== zadnjiDan;
    const glava = noviDan || m.profil !== zadnjiProfil;
    zadnjiDan = d;
    zadnjiProfil = m.profil;

    if (noviDan) {
      const crta = napravi('div', 'cet-dan');
      crta.appendChild(napravi('span', '', d));
      spisak.appendChild(crta);
    }

    const tudja = admin && !m.moja;
    const red = napravi('div', 'cet-poruka' + (m.moja ? ' moja' : '') + (glava ? '' : ' niz') + (tudja ? ' mod' : ''));
    if (tudja) {
      red.title = 'Uredi ovu poruku';
      red.addEventListener('click', () => otvori(m));
    }

    if (glava && !m.moja) red.appendChild(napravi('span', 'cet-lik', inicijali(m.ime)));

    const stub = napravi('div', 'cet-stub');
    if (glava) {
      const meta = napravi('div', 'cet-meta');
      meta.appendChild(napravi('span', 'cet-ko', m.moja ? 'Ti' : m.ime));
      meta.appendChild(napravi('span', 'cet-kad', vrijeme(m.napravljeno)));
      stub.appendChild(meta);
    }
    const tijelo = napravi('div', 'cet-tijelo', m.tekst);
    tijelo.title = new Date(m.napravljeno).toLocaleString('sr-Latn');
    stub.appendChild(tijelo);
    red.appendChild(stub);
    spisak.appendChild(red);
  });

  spisak.scrollTop = bioNaDnu ? spisak.scrollHeight : pozicija;
}

function dodaj(nove, moje) {
  const prije = poruke.length;
  poruke = spoji(poruke, nove);
  if (poruke.length === prije) return;
  if (poruke.length) zadnji = Math.max(zadnji, poruke[poruke.length - 1].id);
  if (moje) naDnu = true;
  if (!naDnu) nevidjene += poruke.length - prije;
  crtaj();
  stanjeSkoka();
}

function stanjeSkoka() {
  skok.hidden = naDnu;
  skok.textContent = nevidjene
    ? nevidjene + (nevidjene === 1 ? ' nova poruka' : nevidjene < 5 ? ' nove poruke' : ' novih poruka')
    : 'Na posljednju poruku';
}

spisak.addEventListener('scroll', () => {
  naDnu = spisak.scrollHeight - spisak.scrollTop - spisak.clientHeight < 120;
  if (naDnu) nevidjene = 0;
  stanjeSkoka();
});

skok.addEventListener('click', () => {
  spisak.scrollTop = spisak.scrollHeight;
  naDnu = true;
  nevidjene = 0;
  stanjeSkoka();
});

polje.addEventListener('input', () => {
  const ostalo = NAJDUZA - polje.value.length;
  brojac.hidden = ostalo > 100;
  brojac.textContent = ostalo;
  forma.querySelector('button').disabled = !polje.value.trim();
});

forma.addEventListener('submit', async e => {
  e.preventDefault();
  const tekst = polje.value.trim();
  if (!tekst) return;
  const dugme = forma.querySelector('button');
  dugme.disabled = true;
  javi(glas, '');
  try {
    const m = await posaljiPoruku(tekst);
    polje.value = '';
    brojac.hidden = true;
    dodaj([m], true);
  } catch (greska) {
    javi(glas, porukaGreske(greska));
    dugme.disabled = false;
  }
  polje.focus();
});

function otvori(m) {
  biram = m;
  prozor.querySelector('.cet-mod-ime').textContent = m.ime;
  prozor.querySelector('.cet-mod-citat').textContent = m.tekst;
  prozor.hidden = false;
  prozor.querySelector('.zatvori').focus();
}

function zatvori() {
  prozor.hidden = true;
  biram = null;
}

function zauzet(da) {
  prozor.querySelectorAll('button:not(.zatvori)').forEach(b => { b.disabled = da; });
}

prozor.addEventListener('click', e => { if (e.target === prozor) zatvori(); });
prozor.querySelector('.zatvori').addEventListener('click', zatvori);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !prozor.hidden) zatvori(); });

prozor.querySelector('.cet-brisi').addEventListener('click', async () => {
  if (!biram) return;
  const id = biram.id;
  zauzet(true);
  try {
    await obrisiPoruku(id);
    poruke = poruke.filter(m => m.id !== id);
    crtaj();
    kratko('Poruka je obrisana.');
  } catch (greska) {
    javi(glas, porukaGreske(greska));
  }
  zauzet(false);
  zatvori();
});

async function kazni(radnja, sati) {
  if (!biram) return;
  const ko = biram;
  zauzet(true);
  try {
    await kazniUCetu(ko.profil, radnja, sati);
    kratko(radnja === 'zabrani' ? ko.ime + ' više ne može da piše u četu.'
      : radnja === 'oslobodi' ? ko.ime + ' opet može da piše.'
      : ko.ime + ' je utišan ' + sati + ' h.');
  } catch (greska) {
    javi(glas, porukaGreske(greska));
  }
  zauzet(false);
  zatvori();
}

const izborSati = prozor.querySelector('.cet-mod-sati');
SATI.forEach(s => {
  const b = napravi('button', '', s + 'h');
  b.type = 'button';
  b.addEventListener('click', () => kazni('utisaj', s));
  izborSati.appendChild(b);
});
prozor.querySelector('.cet-zabrani').addEventListener('click', () => kazni('zabrani'));
prozor.querySelector('.cet-oslobodi').addEventListener('click', () => kazni('oslobodi'));

async function osvjezi() {
  try {
    dodaj(await porukeCeta(zadnji));
  } catch (g) {
    return;
  }
}

(async function kreni() {
  if (!(await imaBazu())) {
    zakljucano.querySelector('p').textContent = 'Čet trenutno ne radi jer baza nije podešena.';
    zakljucano.querySelector('a').hidden = true;
    zakljucano.hidden = false;
    return;
  }

  const ja = await mojProfil();
  if (!ja) {
    zakljucano.hidden = false;
    return;
  }

  admin = ja.uloga === 'admin';
  soba.hidden = false;
  document.getElementById('cet-ja').textContent = ja.ime || ja.email;

  try {
    dodaj(await porukeCeta());
  } catch (greska) {
    javi(glas, porukaGreske(greska));
  }
  crtaj();
  spisak.scrollTop = spisak.scrollHeight;
  setInterval(osvjezi, OSVJEZI_MS);
})();
