import {
  imaBazu, mojProfil, porukaGreske, kazniUCetu,
  ghostJa, ghostNadimak, ghostPoruke, ghostPosalji, ghostKo, ghostObrisi
} from './baza.js';

const OSVJEZI_MS = 3000;
const NAJDUZA = 500;
const SATI = [1, 3, 6, 12, 24];

const soba = document.getElementById('cet');
const spisak = document.getElementById('cet-spisak');
const forma = document.getElementById('cet-forma');
const polje = forma.querySelector('input');
const brojac = document.getElementById('cet-brojac');
const zakljucano = document.getElementById('cet-zakljucano');
const glas = document.getElementById('cet-glas');
const obavjestenje = document.getElementById('cet-obavjestenje');
const prozor = document.getElementById('cet-mod');
const imeForma = document.getElementById('ghost-ime');
const imeGlas = document.getElementById('ghost-ime-glas');
const jaEl = document.getElementById('ghost-ja');

let poruke = [];
let zadnji = 0;
let admin = false;
let biram = null;
let tajmer = null;

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

function napravi(oznaka, klasa, tekst) {
  const e = document.createElement(oznaka);
  if (klasa) e.className = klasa;
  if (tekst != null) e.textContent = tekst;
  return e;
}

function vrijeme(iso) {
  const d = new Date(iso);
  return isNaN(d) ? '' : d.toLocaleTimeString('sr-Latn', { hour: '2-digit', minute: '2-digit' });
}

function crtaj() {
  const naDnu = spisak.scrollHeight - spisak.scrollTop - spisak.clientHeight < 120;
  spisak.textContent = '';

  if (!poruke.length) {
    spisak.appendChild(napravi('p', 'cet-prazno', 'Tiho je. Napiši prvu poruku.'));
    return;
  }

  let zadnjiNadimak = null;
  poruke.forEach(m => {
    const glava = m.nadimak !== zadnjiNadimak;
    zadnjiNadimak = m.nadimak;
    const tudja = admin && !m.moja;
    const red = napravi('div', 'cet-poruka' + (m.moja ? ' moja' : '') + (glava ? '' : ' niz') + (tudja ? ' mod' : ''));
    if (tudja) red.addEventListener('click', () => otvori(m));
    if (glava && !m.moja) red.appendChild(napravi('span', 'cet-lik', m.nadimak.slice(0, 2).toUpperCase()));

    const stub = napravi('div', 'cet-stub');
    if (glava) {
      const meta = napravi('div', 'cet-meta');
      meta.appendChild(napravi('span', 'cet-ko', m.moja ? 'Ti' : m.nadimak));
      meta.appendChild(napravi('span', 'cet-kad', vrijeme(m.napravljeno)));
      stub.appendChild(meta);
    }
    stub.appendChild(napravi('div', 'cet-tijelo', m.tekst));
    red.appendChild(stub);
    spisak.appendChild(red);
  });

  if (naDnu) spisak.scrollTop = spisak.scrollHeight;
}

function dodaj(nove) {
  const vidjene = new Set(poruke.map(m => m.id));
  const dodate = nove.filter(m => !vidjene.has(m.id));
  if (!dodate.length) return;
  poruke = [...poruke, ...dodate].sort((a, b) => a.id - b.id);
  const granica = Date.now() - 12 * 3600 * 1000;
  poruke = poruke.filter(m => new Date(m.napravljeno).getTime() > granica);
  zadnji = Math.max(zadnji, ...poruke.map(m => m.id));
  crtaj();
}

async function osvjezi() {
  try {
    dodaj(await ghostPoruke(zadnji));
  } catch (g) {}
}

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
    const m = await ghostPosalji(tekst);
    polje.value = '';
    brojac.hidden = true;
    dodaj([m]);
    spisak.scrollTop = spisak.scrollHeight;
  } catch (greska) {
    javi(glas, porukaGreske(greska));
    dugme.disabled = false;
  }
  polje.focus();
});

async function otvori(m) {
  biram = m;
  prozor.querySelector('.cet-mod-ime').textContent = m.nadimak;
  prozor.querySelector('.cet-mod-citat').textContent = m.tekst;
  const ko = document.getElementById('ghost-ko');
  ko.textContent = 'Tražim ko je…';
  prozor.hidden = false;
  prozor.querySelector('.zatvori').focus();
  try {
    const osoba = await ghostKo(m.id);
    ko.textContent = 'Nalog: ' + [osoba.ime, osoba.email].filter(Boolean).join(', ');
  } catch (greska) {
    ko.textContent = porukaGreske(greska);
  }
}

function zatvori() {
  prozor.hidden = true;
  biram = null;
}

prozor.addEventListener('click', e => { if (e.target === prozor) zatvori(); });
prozor.querySelector('.zatvori').addEventListener('click', zatvori);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !prozor.hidden) zatvori(); });

prozor.querySelector('.cet-brisi').addEventListener('click', async () => {
  if (!biram) return;
  const id = biram.id;
  try {
    await ghostObrisi(id);
    poruke = poruke.filter(m => m.id !== id);
    crtaj();
    kratko('Poruka je obrisana.');
  } catch (greska) {
    javi(glas, porukaGreske(greska));
  }
  zatvori();
});

async function kazni(radnja, sati) {
  if (!biram || !biram.profil) return;
  const ko = biram;
  try {
    await kazniUCetu(ko.profil, radnja, sati);
    kratko(radnja === 'zabrani' ? ko.nadimak + ' više ne može da piše.'
      : radnja === 'oslobodi' ? ko.nadimak + ' opet može da piše.'
      : ko.nadimak + ' je utišan ' + sati + ' h.');
  } catch (greska) {
    javi(glas, porukaGreske(greska));
  }
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

function pokaziSobu(nadimak) {
  jaEl.textContent = nadimak;
  imeForma.hidden = true;
  soba.hidden = false;
  polje.focus();
  if (tajmer) return;
  ghostPoruke().then(dodaj).then(() => { spisak.scrollTop = spisak.scrollHeight; }).catch(greska => javi(glas, porukaGreske(greska)));
  tajmer = setInterval(osvjezi, OSVJEZI_MS);
}

function traziIme(staro) {
  soba.hidden = true;
  imeForma.hidden = false;
  imeForma.elements.nadimak.value = staro || '';
  imeForma.elements.nadimak.focus();
}

imeForma.addEventListener('submit', async e => {
  e.preventDefault();
  const nadimak = imeForma.elements.nadimak.value.trim();
  try {
    const o = await ghostNadimak(nadimak);
    javi(imeGlas, '');
    pokaziSobu(o.nadimak);
  } catch (greska) {
    javi(imeGlas, porukaGreske(greska));
  }
});

document.getElementById('ghost-promijeni').addEventListener('click', () => traziIme(jaEl.textContent));

(async function kreni() {
  if (!(await imaBazu())) {
    zakljucano.querySelector('p').textContent = 'Soba trenutno ne radi jer baza nije podešena.';
    zakljucano.querySelector('a').hidden = true;
    zakljucano.hidden = false;
    return;
  }

  const ja = await mojProfil();
  if (!ja) {
    zakljucano.hidden = false;
    return;
  }
  if (ja.uloga === 'nastavnik') {
    zakljucano.querySelector('h2').textContent = 'Samo za učenike';
    zakljucano.querySelector('p').textContent = 'Ova soba je otvorena samo za učenike.';
    zakljucano.querySelector('a').hidden = true;
    zakljucano.hidden = false;
    return;
  }

  admin = ja.uloga === 'admin';
  try {
    const stanje = await ghostJa();
    if (stanje.nadimak) pokaziSobu(stanje.nadimak);
    else traziIme();
  } catch (greska) {
    javi(imeGlas, porukaGreske(greska));
    imeForma.hidden = false;
  }
})();
