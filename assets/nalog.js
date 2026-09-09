import { baza, podesena, mojProfil, odjaviSe } from './baza.js';

const meni = document.getElementById('meni');
if (meni && podesena) {
  const veza = meni.querySelector('a[href="prijava.html"]');

  async function osvjezi() {
    const p = await mojProfil();
    meni.querySelectorAll('a[data-nalog]').forEach(e => e.remove());

    if (!p) {
      if (veza) { veza.textContent = 'Prijava'; veza.href = 'prijava.html'; veza.hidden = false; }
      return;
    }

    if (p.uloga === 'admin') {
      const a = document.createElement('a');
      a.href = 'admin.html';
      a.textContent = 'Admin';
      a.dataset.nalog = '1';
      meni.insertBefore(a, veza);
    }

    if (veza) {
      veza.textContent = 'Odjava';
      veza.href = '#';
      veza.hidden = false;
      veza.onclick = async e => {
        e.preventDefault();
        await odjaviSe();
        location.href = 'index.html';
      };
    }
  }

  osvjezi();
  baza.auth.onAuthStateChange(osvjezi);
}
