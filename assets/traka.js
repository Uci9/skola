(function () {
  const okvir = document.getElementById('traka');
  if (!okvir) return;
  if (!matchMedia('(min-width: 901px)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const SLIKE_A = [
    'https://images.unsplash.com/photo-1749738456487-2af715ab65ea?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://plus.unsplash.com/premium_photo-1720139288219-e20aa9c8895b?q=80&w=1810&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  ];

  const SLIKE_B = SLIKE_A.slice();
  const OSNOVNA = 6;

  okvir.hidden = false;

  function nizSlika(izvori) {
    return izvori.map(izvor => {
      const s = document.createElement('img');
      s.src = izvor + '&ixlib=rb-4.0.3';
      s.alt = '';
      s.width = 240;
      s.height = 160;
      s.loading = 'eager';
      s.decoding = 'async';
      s.className = 'traka-slika';
      return s;
    });
  }

  function napraviRed(izvori, smjer) {
    const red = document.createElement('div');
    red.className = 'traka-red';

    const vrpca = document.createElement('div');
    vrpca.className = 'traka-vrpca';

    const skup = document.createElement('div');
    skup.className = 'traka-skup';
    nizSlika(izvori).forEach(s => skup.appendChild(s));
    vrpca.appendChild(skup);

    red.appendChild(vrpca);
    okvir.appendChild(red);

    return { vrpca, skup, smjer, pomak: 0, sirina: 0 };
  }

  const redovi = [napraviRed(SLIKE_A, 1), napraviRed(SLIKE_B, -1)];

  function popuni() {
    redovi.forEach(red => {
      const sirinaSkupa = red.skup.scrollWidth;
      if (!sirinaSkupa) return;

      red.sirina = sirinaSkupa;
      const koliko = Math.ceil((okvir.clientWidth * 2) / sirinaSkupa) + 1;

      while (red.vrpca.children.length > 1) red.vrpca.lastElementChild.remove();
      for (let i = 1; i < koliko; i++) red.vrpca.appendChild(red.skup.cloneNode(true));
    });
  }

  let brzinaSkrola = 0;
  let zadnjiY = scrollY;

  addEventListener('scroll', () => {
    brzinaSkrola = scrollY - zadnjiY;
    zadnjiY = scrollY;
  }, { passive: true });

  let prosli = performance.now();

  function kadar(sada) {
    const dt = Math.min(0.05, (sada - prosli) / 1000);
    prosli = sada;

    const cinilac = Math.max(-5, Math.min(5, (brzinaSkrola / dt) / 1000));
    brzinaSkrola *= 0.85;

    redovi.forEach(red => {
      if (!red.sirina) return;
      const smjer = cinilac < 0 ? -red.smjer : red.smjer;
      let hod = smjer * OSNOVNA * 10 * dt;
      hod += smjer * hod * Math.abs(cinilac);

      red.pomak -= hod;
      if (red.pomak <= -red.sirina) red.pomak += red.sirina;
      if (red.pomak >= 0) red.pomak -= red.sirina;

      red.vrpca.style.transform = 'translate3d(' + red.pomak.toFixed(2) + 'px,0,0)';
    });

    requestAnimationFrame(kadar);
  }

  function pokreni() {
    popuni();
    redovi.forEach(red => { red.pomak = -red.sirina / 2; });
    requestAnimationFrame(kadar);
  }

  addEventListener('resize', popuni);

  if (document.readyState === 'complete') pokreni();
  else addEventListener('load', pokreni);
})();
