(function () {
  const tipka = document.getElementById('cet-tipka');
  const znacka = document.getElementById('cet-tipka-broj');
  if (!tipka || !znacka) return;

  function procitaj() {
    try { return localStorage.getItem('cet-vidjeno'); } catch (g) { return null; }
  }

  function upisi(id) {
    try { localStorage.setItem('cet-vidjeno', id); } catch (g) {}
  }

  function pokazi(broj) {
    znacka.hidden = !broj;
    znacka.textContent = broj > 99 ? '99+' : broj;
    tipka.setAttribute('aria-label', broj
      ? 'Školski čet u kutku učenika, nepročitanih poruka: ' + broj
      : 'Školski čet u kutku učenika');
  }

  async function provjeri() {
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
      pokazi(poruke.filter(m => !m.moja).length);
    } catch (g) {}
  }

  fetch('/api/ja', { credentials: 'same-origin' })
    .then(r => r.ok ? r.json() : null)
    .then(ja => {
      if (!ja || !ja.id) return;
      provjeri();
      setInterval(provjeri, 15000);
    })
    .catch(() => {});
})();
