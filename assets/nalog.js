import { mojProfil, odjaviSe, novo } from './baza.js';

const meni = document.getElementById('meni');
if (meni) {
  const veza = meni.querySelector('a[href="prijava.html"]');

  async function osvjezi() {
    const p = await mojProfil();
    meni.querySelectorAll('a[data-nalog]').forEach(e => e.remove());

    if (!p) {
      if (veza) { veza.textContent = 'Prijava'; veza.href = 'prijava.html'; veza.hidden = false; }
      return;
    }

    if (p.uloga === 'admin' || p.uloga === 'nastavnik') {
      const a = document.createElement('a');
      a.href = 'admin.html';
      a.textContent = p.uloga === 'admin' ? 'Admin' : 'Panel';
      a.dataset.nalog = '1';
      meni.insertBefore(a, veza);
      if (p.uloga === 'admin') {
        novo().then(n => {
          const svega = n.firme + n.prijedlozi;
          if (!svega) return;
          const z = document.createElement('b');
          z.className = 'adm-novo meni-novo';
          z.textContent = svega > 99 ? '99+' : svega;
          a.appendChild(z);
        }).catch(() => {});
      }
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
}
