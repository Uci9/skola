(function () {
  const mreza = document.getElementById('mreza');
  if (!mreza) return;

  const karte = [...mreza.querySelectorAll('.plocica')];
  const zastor = document.getElementById('zastor-mreze');
  if (!karte.length || !zastor) return;

  const smireno = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let otvorena = null;
  let drzac = null;
  let polazni = null;

  function ciljniOkvir() {
    const uzak = innerWidth < 760;
    const s = uzak ? innerWidth * 0.92 : Math.min(innerWidth * 0.7, 880);
    const v = uzak ? innerHeight * 0.6 : Math.min(innerHeight * 0.62, 560);
    return {
      left: (innerWidth - s) / 2,
      top: (innerHeight - v) / 2,
      width: s,
      height: v
    };
  }

  function otvori(karta) {
    if (otvorena) return;
    otvorena = karta;
    polazni = karta.getBoundingClientRect();

    drzac = document.createElement('div');
    drzac.className = 'plocica-drzac plocica';
    if (karta.classList.contains('siroka')) drzac.classList.add('siroka');
    drzac.style.height = polazni.height + 'px';
    karta.after(drzac);

    karta.classList.add('leti');
    karta.style.top = polazni.top + 'px';
    karta.style.left = polazni.left + 'px';
    karta.style.width = polazni.width + 'px';
    karta.style.height = polazni.height + 'px';

    zastor.hidden = false;
    void karta.offsetWidth;

    requestAnimationFrame(() => {
      const c = ciljniOkvir();
      karta.classList.add('siri');
      zastor.classList.add('vidi');
      if (!smireno) karta.style.transition =
        'top .45s cubic-bezier(.2,.8,.3,1), left .45s cubic-bezier(.2,.8,.3,1),' +
        ' width .45s cubic-bezier(.2,.8,.3,1), height .45s cubic-bezier(.2,.8,.3,1)';
      karta.style.top = c.top + 'px';
      karta.style.left = c.left + 'px';
      karta.style.width = c.width + 'px';
      karta.style.height = c.height + 'px';
    });

    karta.setAttribute('aria-expanded', 'true');
  }

  function zatvori() {
    if (!otvorena) return;
    const karta = otvorena;
    const nazad = drzac ? drzac.getBoundingClientRect() : polazni;

    karta.classList.remove('siri');
    zastor.classList.remove('vidi');
    karta.style.top = nazad.top + 'px';
    karta.style.left = nazad.left + 'px';
    karta.style.width = nazad.width + 'px';
    karta.style.height = nazad.height + 'px';

    const kraj = () => {
      karta.classList.remove('leti');
      karta.removeAttribute('style');
      karta.setAttribute('aria-expanded', 'false');
      if (drzac) drzac.remove();
      drzac = null;
      otvorena = null;
      zastor.hidden = true;
      karta.focus();
    };

    if (smireno) kraj();
    else setTimeout(kraj, 450);
  }

  karte.forEach(karta => {
    karta.setAttribute('aria-expanded', 'false');
    karta.addEventListener('click', () => {
      if (otvorena === karta) zatvori();
      else if (!otvorena) otvori(karta);
    });
  });

  zastor.addEventListener('click', zatvori);
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') zatvori();
  });
  addEventListener('resize', () => {
    if (!otvorena) return;
    const c = ciljniOkvir();
    otvorena.style.top = c.top + 'px';
    otvorena.style.left = c.left + 'px';
    otvorena.style.width = c.width + 'px';
    otvorena.style.height = c.height + 'px';
  });
})();
