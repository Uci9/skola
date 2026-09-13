import { imaBazu, porukaGreske, trenutniKorisnik, jeAdmin, prijaviSe, napraviNalog } from './baza.js';

const DOMEN = '@ets-pg.edu.me';

function uEpostu(vrijednost) {
  const t = vrijednost.trim();
  if (!t) return t;
  return t.includes('@') ? t : t.toLowerCase().replace(/\s+/g, '') + DOMEN;
}

const dugmad = [...document.querySelectorAll('.tabovi button')];
const formaPrijava = document.getElementById('formaPrijava');
const formaUpis = document.getElementById('formaUpis');
const glas = document.getElementById('glas');
const nepodesena = document.getElementById('nepodesena');

function javi(tekst, dobro) {
  glas.textContent = tekst;
  glas.hidden = !tekst;
  glas.classList.toggle('dobro', Boolean(dobro));
  glas.classList.toggle('lose', Boolean(tekst) && !dobro);
}

dugmad.forEach(d => d.addEventListener('click', () => {
  dugmad.forEach(x => x.classList.toggle('on', x === d));
  formaPrijava.hidden = d.dataset.tab !== 'prijava';
  formaUpis.hidden = d.dataset.tab !== 'upis';
  javi('');
}));

if (!(await imaBazu())) {
  nepodesena.hidden = false;
  formaPrijava.hidden = true;
  formaUpis.hidden = true;
  document.querySelector('.tabovi').hidden = true;
} else {
  trenutniKorisnik().then(k => {
    if (k) javi('Već si prijavljen kao ' + k.email + '.', true);
  });

  formaPrijava.addEventListener('submit', async e => {
    e.preventDefault();
    const dugme = formaPrijava.querySelector('button[type=submit]');
    dugme.disabled = true;
    javi('Prijavljujem…');

    try {
      await prijaviSe(uEpostu(formaPrijava.eposta.value), formaPrijava.lozinka.value);
    } catch (greska) {
      dugme.disabled = false;
      javi(porukaGreske(greska));
      return;
    }

    dugme.disabled = false;
    javi('Prijavljen. Vodim te dalje…', true);
    location.href = (await jeAdmin()) ? 'admin.html' : 'index.html';
  });

  formaUpis.addEventListener('submit', async e => {
    e.preventDefault();
    const dugme = formaUpis.querySelector('button[type=submit]');
    dugme.disabled = true;
    javi('Pravim nalog…');

    try {
      await napraviNalog(uEpostu(formaUpis.eposta.value), formaUpis.lozinka.value, formaUpis.ime.value.trim());
    } catch (greska) {
      dugme.disabled = false;
      javi(porukaGreske(greska));
      return;
    }

    dugme.disabled = false;
    javi('Nalog napravljen.', true);
    location.href = 'index.html';
  });
}
