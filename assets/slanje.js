import { imaBazu, mojProfil, porukaGreske, posaljiPrijedlog } from './baza.js';

const okvir = document.getElementById('slanje');
if (okvir) {
  const poziv = document.getElementById('slanje-poziv');
  const forma = document.getElementById('slanje-forma');
  const glas = document.getElementById('slanje-glas');
  const ulaz = forma.querySelector('input[type=file]');
  const pregled = document.getElementById('slanje-pregled');

  function javi(tekst, dobro) {
    glas.textContent = tekst;
    glas.hidden = !tekst;
    glas.classList.toggle('dobro', Boolean(dobro));
    glas.classList.toggle('lose', Boolean(tekst) && !dobro);
  }

  ulaz.addEventListener('change', () => {
    const f = ulaz.files[0];
    if (!f) { pregled.hidden = true; return; }
    pregled.src = URL.createObjectURL(f);
    pregled.hidden = false;
  });

  forma.addEventListener('submit', async e => {
    e.preventDefault();
    const f = ulaz.files[0];
    if (!f) { javi('Izaberi sliku.'); return; }

    const dugme = forma.querySelector('button[type=submit]');
    dugme.disabled = true;
    javi('Šaljem…');

    try {
      await posaljiPrijedlog(f, forma.naslov.value.trim(), forma.opis.value.trim());
    } catch (greska) {
      dugme.disabled = false;
      javi(porukaGreske(greska));
      return;
    }

    dugme.disabled = false;
    forma.reset();
    pregled.hidden = true;
    javi('Slika je stigla školi. Objaviće je kad je pregledaju.', true);
  });

  (async function pripremi() {
    if (!(await imaBazu())) {
      poziv.innerHTML = '<p class="lede">Slanje slika još ne radi — baza nije podešena.</p>';
      poziv.hidden = false;
      return;
    }

    const ja = await mojProfil();
    if (!ja) {
      poziv.hidden = false;
      return;
    }

    poziv.hidden = true;
    forma.hidden = false;
    document.getElementById('slanje-ko').textContent = ja.ime || ja.email;
  })();
}
