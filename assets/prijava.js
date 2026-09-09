import { baza, podesena, porukaGreske, trenutniKorisnik, jeAdmin } from './baza.js';

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

if (!podesena) {
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

    const { error } = await baza.auth.signInWithPassword({
      email: formaPrijava.eposta.value.trim(),
      password: formaPrijava.lozinka.value
    });

    dugme.disabled = false;
    if (error) { javi(porukaGreske(error)); return; }

    javi('Prijavljen. Vodim te dalje…', true);
    location.href = (await jeAdmin()) ? 'admin.html' : 'index.html';
  });

  formaUpis.addEventListener('submit', async e => {
    e.preventDefault();
    const dugme = formaUpis.querySelector('button[type=submit]');
    dugme.disabled = true;
    javi('Pravim nalog…');

    const { data, error } = await baza.auth.signUp({
      email: formaUpis.eposta.value.trim(),
      password: formaUpis.lozinka.value,
      options: { data: { ime: formaUpis.ime.value.trim() } }
    });

    dugme.disabled = false;
    if (error) { javi(porukaGreske(error)); return; }

    if (data.session) {
      javi('Nalog napravljen.', true);
      location.href = 'index.html';
    } else {
      javi('Nalog napravljen. Provjeri e-poštu i potvrdi ga, pa se prijavi.', true);
    }
  });
}
