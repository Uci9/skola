(function () {
  const okvir = document.getElementById('mek');
  if (!okvir) return;

  const naslov = okvir.querySelector('.mek-naslov');
  const scena = okvir.querySelector('.mek-scena');
  const stit = document.getElementById('mek-stit');
  const poklopac = okvir.querySelector('.mek-poklopac');
  const tastatura = okvir.querySelector('.mek-tastatura');
  if (!poklopac || !tastatura) return;

  const REDOVI = [
    [['esc', 'sird'], ['F1'], ['F2'], ['F3'], ['F4'], ['F5'], ['F6'], ['F7'], ['F8'], ['F9'], ['F10'], ['F11'], ['F12'], ['', 'oblo']],
    [['~\n`'], ['!\n1'], ['@\n2'], ['#\n3'], ['$\n4'], ['%\n5'], ['^\n6'], ['&\n7'], ['*\n8'], ['(\n9'], [')\n0'], ['—\n_'], ['+\n='], ['delete', 'sird kraj']],
    [['tab', 'sird'], ['Q'], ['W'], ['E'], ['R'], ['T'], ['Z'], ['U'], ['I'], ['O'], ['P'], ['Š'], ['Đ'], ['|\n\\']],
    [['caps lock', 'siri'], ['A'], ['S'], ['D'], ['F'], ['G'], ['H'], ['J'], ['K'], ['L'], ['Č'], ['Ć'], ['return', 'siri kraj']],
    [['shift', 'najsiri'], ['Y'], ['X'], ['C'], ['V'], ['B'], ['N'], ['M'], ['<\n,'], ['>\n.'], ['?\n/'], ['shift', 'najsiri kraj']],
    [['fn'], ['control'], ['option'], ['command', 'sird'], ['', 'razmak'], ['command', 'sird'], ['option'], ['', 'strelice']]
  ];

  function tipka(natpis, vrsta) {
    const t = document.createElement('div');
    t.className = 'mek-tipka' + (vrsta ? ' ' + vrsta : '');
    const u = document.createElement('span');
    natpis.split('\n').forEach(dio => {
      const r = document.createElement('b');
      r.textContent = dio;
      u.appendChild(r);
    });
    t.appendChild(u);
    return t;
  }

  function strelice() {
    const kutija = document.createElement('div');
    kutija.className = 'mek-strelice';
    const gore = tipka('▲', 'mala');
    kutija.appendChild(gore);
    const donji = document.createElement('div');
    ['◀', '▼', '▶'].forEach(z => donji.appendChild(tipka(z, 'mala')));
    kutija.appendChild(donji);
    return kutija;
  }

  REDOVI.forEach(red => {
    const r = document.createElement('div');
    r.className = 'mek-red';
    red.forEach(([natpis, vrsta]) => {
      if (vrsta === 'strelice') r.appendChild(strelice());
      else r.appendChild(tipka(natpis, vrsta));
    });
    tastatura.appendChild(r);
  });

  if (stit) {
    stit.addEventListener('click', () => okvir.classList.add('ziva'));
  }

  const smireno = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (smireno) {
    poklopac.style.transform = 'translateY(0) rotateX(0deg) scale(1)';
    return;
  }

  let ceka = false;

  function odsjecak(p, a, b, od, dd) {
    const k = Math.min(1, Math.max(0, (p - a) / (b - a)));
    return od + (dd - od) * k;
  }

  function crtaj() {
    const m = okvir.getBoundingClientRect();
    const hod = m.height - (scena ? scena.offsetHeight : innerHeight);
    if (hod <= 0) return;
    const p = Math.min(1, Math.max(0, -m.top / hod));
    const usko = matchMedia('(max-width: 820px)').matches;

    const sx = odsjecak(p, 0, 0.34, 1.2, usko ? 1 : 1.14);
    const sy = odsjecak(p, 0, 0.34, 0.6, usko ? 1 : 1.14);
    const pomak = odsjecak(p, 0.34, 0.78, 0, usko ? 128 : 168);
    const zaokret = odsjecak(p, 0.04, 0.34, -28, 0);

    poklopac.style.transform =
      'translateY(' + pomak.toFixed(1) + 'px)' +
      ' rotateX(' + zaokret.toFixed(2) + 'deg)' +
      ' scale(' + sx.toFixed(3) + ', ' + sy.toFixed(3) + ')';

    if (naslov) {
      naslov.style.transform = 'translateY(' + odsjecak(p, 0.06, 0.4, 0, 60).toFixed(1) + 'px)';
      naslov.style.opacity = odsjecak(p, 0.1, 0.34, 1, 0).toFixed(3);
    }
  }

  addEventListener('scroll', () => {
    if (ceka) return;
    ceka = true;
    requestAnimationFrame(() => { ceka = false; crtaj(); });
  }, { passive: true });

  addEventListener('resize', crtaj);
  crtaj();
})();
