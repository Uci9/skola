(function () {
  const spisak = document.getElementById('dogadjaji-spisak');
  if (!spisak) return;

  const sada = new Date();
  const danas = sada.getFullYear() + '-' + String(sada.getMonth() + 1).padStart(2, '0') + '-' + String(sada.getDate()).padStart(2, '0');

  function napravi(oznaka, klasa, tekst) {
    const e = document.createElement(oznaka);
    if (klasa) e.className = klasa;
    if (tekst) e.textContent = tekst;
    return e;
  }

  function datum(iso) {
    const [g, m, d] = iso.split('-');
    const kratko = Number(d) + '. ' + Number(m) + '.';
    return Number(g) === sada.getFullYear() ? kratko : kratko + ' ' + g + '.';
  }

  fetch('/api/dogadjaji')
    .then(o => o.ok ? o.json() : [])
    .then(svi => {
      if (!Array.isArray(svi)) return;
      const buduci = svi.filter(d => d.datum >= danas);
      if (!buduci.length) return;

      spisak.textContent = '';
      buduci.forEach(d => {
        const red = napravi('div', 'tile dogadjaj');
        red.appendChild(napravi('span', 'tile-chip', datum(d.datum)));
        const sredina = napravi('span', 'tile-mid');
        sredina.appendChild(napravi('h3', null, d.naziv));
        const gdje = [d.vrijeme, d.mjesto].filter(Boolean).join(' · ');
        if (gdje) sredina.appendChild(napravi('p', 'dogadjaj-gdje', gdje));
        if (d.opis) sredina.appendChild(napravi('p', 'dogadjaj-opis', d.opis));
        red.appendChild(sredina);
        spisak.appendChild(red);
      });
    })
    .catch(() => {});
})();
