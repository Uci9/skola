import { imaBazu, porukaGreske, posaljiFirmu } from './baza.js';

const forma = document.getElementById('firma-forma');
const glas = document.getElementById('firma-glas');
const hvala = document.getElementById('firma-hvala');

function javi(tekst, dobro) {
  glas.textContent = tekst;
  glas.hidden = !tekst;
  glas.classList.toggle('dobro', Boolean(dobro));
  glas.classList.toggle('lose', Boolean(tekst) && !dobro);
}

forma.addEventListener('submit', async e => {
  e.preventDefault();

  const podaci = Object.fromEntries(new FormData(forma));
  if (!podaci.naziv.trim()) {
    javi('Upišite naziv firme.');
    forma.naziv.focus();
    return;
  }
  if (!forma.email.checkValidity() || !podaci.email.trim()) {
    javi('Upišite ispravnu e-poštu za kontakt.');
    forma.email.focus();
    return;
  }
  if (podaci.osnovana && !forma.osnovana.checkValidity()) {
    javi('Godinu osnivanja upišite sa četiri cifre.');
    forma.osnovana.focus();
    return;
  }

  const dugme = forma.querySelector('button[type=submit]');
  dugme.disabled = true;
  javi('Šaljem…');

  try {
    await posaljiFirmu(podaci);
  } catch (greska) {
    dugme.disabled = false;
    javi(porukaGreske(greska));
    return;
  }

  forma.hidden = true;
  hvala.hidden = false;
  hvala.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

imaBazu().then(ima => {
  if (ima) return;
  forma.querySelector('button[type=submit]').disabled = true;
  javi('Upitnik trenutno ne radi. Pišite nam na skola@ets-pg.edu.me.');
});
