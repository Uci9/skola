(function () {
  const tipka = document.getElementById('cet-tipka');
  const prozor = document.getElementById('cet-prozor');
  const znacka = document.getElementById('cet-tipka-broj');
  if (!tipka || !prozor) return;

  let prijavljen = false;

  function procitaj() {
    try { return localStorage.getItem('cet-vidjeno'); } catch (g) { return null; }
  }

  function upisi(id) {
    try { localStorage.setItem('cet-vidjeno', id); } catch (g) {}
  }

  function pokazi(broj) {
    znacka.hidden = !broj;
    znacka.textContent = broj > 99 ? '99+' : broj;
    tipka.setAttribute('aria-label', prozor.hidden
      ? (broj ? 'Otvori čet, nepročitanih poruka: ' + broj : 'Otvori čet')
      : 'Zatvori čet');
  }

  async function provjeri() {
    if (!prijavljen || !prozor.hidden) return;
    const vidjeno = procitaj();
    try {
      const odgovor = await fetch('/api/cet' + (vidjeno ? '?od=' + vidjeno : ''), { credentials: 'same-origin' });
      if (!odgovor.ok) return;
      const poruke = await odgovor.json();
      if (vidjeno === null) {
        upisi(poruke.length ? poruke[poruke.length - 1].id : 0);
        pokazi(0);
        return;
      }
      if (prozor.hidden) pokazi(poruke.filter(m => !m.moja).length);
    } catch (g) {}
  }

  function otvori(da) {
    const stari = prozor.querySelector('iframe');
    if (da && !stari) {
      const okvir = document.createElement('iframe');
      okvir.src = 'cet.html?mali';
      okvir.title = 'Školski čet';
      prozor.appendChild(okvir);
    }
    if (!da && stari) stari.remove();
    prozor.hidden = !da;
    tipka.classList.toggle('upaljen', da);
    tipka.setAttribute('aria-expanded', String(da));
    pokazi(0);
    if (!da) provjeri();
  }

  tipka.addEventListener('click', () => otvori(prozor.hidden));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !prozor.hidden) otvori(false);
  });

  fetch('/api/ja', { credentials: 'same-origin' })
    .then(r => r.ok ? r.json() : null)
    .then(ja => {
      prijavljen = Boolean(ja && ja.id);
      if (!prijavljen) return;
      provjeri();
      setInterval(provjeri, 15000);
    })
    .catch(() => {});
})();
