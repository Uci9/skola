(function () {
  if (!matchMedia('(pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const strelica = document.createElement('div');
  strelica.className = 'kursor';
  strelica.setAttribute('aria-hidden', 'true');
  strelica.innerHTML =
    '<svg viewBox="0 0 50 54" width="25" height="27" fill="none">' +
    '<path d="M42.6 35.5 11.8 4.3C9.4 1.9 5.3 3.5 5.3 6.9v40.1c0 3.5 4.3 5 6.6 2.5l8.2-8.9' +
    'a4 4 0 0 1 3-1.3h16.7c3.4 0 5.2-4 2.8-6.4Z" fill="currentColor" ' +
    'stroke="#F7F2EA" stroke-width="2.4" stroke-linejoin="round"/></svg>';

  document.body.appendChild(strelica);
  document.documentElement.classList.add('sa-kursorom');

  const cilj = { x: innerWidth / 2, y: innerHeight / 2 };
  const sada = { x: cilj.x, y: cilj.y };
  const KRUTOST = 0.22;
  const TRENJE = 0.62;

  let bx = 0;
  let by = 0;
  let ugao = 0;
  let razmjera = 1;
  let radi = false;
  let vidi = false;

  function kadar() {
    const dx = cilj.x - sada.x;
    const dy = cilj.y - sada.y;

    bx = (bx + dx * KRUTOST) * TRENJE;
    by = (by + dy * KRUTOST) * TRENJE;
    sada.x += bx;
    sada.y += by;

    const brzina = Math.hypot(bx, by);

    const zeljeni = brzina > 0.6 ? Math.atan2(by, bx) * 180 / Math.PI + 90 : 0;
    let razlika = zeljeni - ugao;
    while (razlika > 180) razlika -= 360;
    while (razlika < -180) razlika += 360;
    ugao += razlika * (brzina > 0.6 ? 0.22 : 0.08);

    const ciljanaRazmjera = Math.max(0.72, 1 - brzina / 90);
    razmjera += (ciljanaRazmjera - razmjera) * 0.16;

    strelica.style.transform =
      'translate3d(' + sada.x.toFixed(2) + 'px,' + sada.y.toFixed(2) + 'px,0)' +
      ' rotate(' + ugao.toFixed(2) + 'deg) scale(' + razmjera.toFixed(3) + ')';

    if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1 && brzina < 0.05 && Math.abs(ugao) < 0.4) {
      ugao = 0;
      strelica.style.transform =
        'translate3d(' + sada.x.toFixed(2) + 'px,' + sada.y.toFixed(2) + 'px,0) rotate(0deg) scale(1)';
      radi = false;
      return;
    }

    requestAnimationFrame(kadar);
  }

  function pokreni() {
    if (radi) return;
    radi = true;
    requestAnimationFrame(kadar);
  }

  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    cilj.x = e.clientX;
    cilj.y = e.clientY;
    if (!vidi) {
      vidi = true;
      strelica.classList.add('gori');
    }
    pokreni();
  }, { passive: true });

  addEventListener('pointerdown', () => strelica.classList.add('pritisnut'));
  addEventListener('pointerup', () => strelica.classList.remove('pritisnut'));

  document.addEventListener('mouseleave', () => {
    vidi = false;
    strelica.classList.remove('gori');
  });

  document.addEventListener('mouseenter', () => {
    vidi = true;
    strelica.classList.add('gori');
  });
})();
