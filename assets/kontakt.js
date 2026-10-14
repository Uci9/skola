import { imaBazu, porukaGreske, posaljiSkoli } from './baza.js';

const forma = document.getElementById('kontakt-forma');
const glas = document.getElementById('kontakt-glas');
const hvala = document.getElementById('kontakt-hvala');

function javi(tekst, dobro) {
  glas.textContent = tekst;
  glas.hidden = !tekst;
  glas.classList.toggle('dobro', Boolean(dobro));
  glas.classList.toggle('lose', Boolean(tekst) && !dobro);
}

forma.addEventListener('submit', async e => {
  e.preventDefault();
  const podaci = Object.fromEntries(new FormData(forma));

  if (!podaci.ime.trim()) {
    javi('Upišite ime i prezime.');
    forma.ime.focus();
    return;
  }
  if (!podaci.email.trim() || !forma.email.checkValidity()) {
    javi('Upišite ispravnu e-poštu, da škola može da odgovori.');
    forma.email.focus();
    return;
  }
  if (podaci.poruka.trim().length < 5) {
    javi('Napišite poruku.');
    forma.poruka.focus();
    return;
  }

  const dugme = forma.querySelector('button[type=submit]');
  dugme.disabled = true;
  javi('Šaljem…');

  try {
    await posaljiSkoli(podaci);
  } catch (greska) {
    dugme.disabled = false;
    javi(porukaGreske(greska));
    return;
  }

  dugme.disabled = false;
  javi('');
  forma.reset();
  forma.hidden = true;
  hvala.hidden = false;
});

document.getElementById('kontakt-jos').addEventListener('click', () => {
  hvala.hidden = true;
  forma.hidden = false;
  forma.ime.focus();
});

imaBazu().then(ima => {
  if (ima) return;
  forma.querySelector('button[type=submit]').disabled = true;
  javi('Slanje poruka trenutno ne radi. Pozovite školu na 020 237 120.');
});
