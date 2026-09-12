(function () {
  const okvir = document.getElementById('paralaks');
  if (!okvir) return;

  const ploca = okvir.querySelector('.paralaks-ploca');
  const redovi = [...okvir.querySelectorAll('.paralaks-red')];
  if (!ploca || !redovi.length) return;

  const smireno = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (smireno) {
    ploca.style.opacity = '1';
    ploca.style.transform = 'none';
    return;
  }

  const stanje = {
    pomak: 0,
    nagib: 15,
    zaokret: 20,
    visina: -700,
    vidljivost: 0.2
  };

  const cilj = { ...stanje };
  let radi = false;
  let ceka = false;

  function mjere() {
    return matchMedia('(max-width: 820px)').matches
      ? { domet: 420, od: -450, do: 250 }
      : { domet: 1000, od: -700, do: 500 };
  }

  function napredak() {
    const m = okvir.getBoundingClientRect();
    const hod = m.height;
    if (hod <= 0) return 0;
    return Math.min(1, Math.max(0, -m.top / hod));
  }

  function odsjecak(p, a, b, od, dd) {
    const k = Math.min(1, Math.max(0, (p - a) / (b - a)));
    return od + (dd - od) * k;
  }

  function postavi() {
    const p = napredak();
    const m = mjere();

    cilj.pomak = p * m.domet;
    cilj.nagib = odsjecak(p, 0, 0.2, 15, 0);
    cilj.zaokret = odsjecak(p, 0, 0.2, 20, 0);
    cilj.visina = odsjecak(p, 0, 0.2, m.od, m.do);
    cilj.vidljivost = odsjecak(p, 0, 0.2, 0.2, 1);

    if (!radi) {
      radi = true;
      requestAnimationFrame(korak);
    }
  }

  function korak() {
    let mice = false;
    const meko = 0.16;

    for (const kljuc of Object.keys(stanje)) {
      const razlika = cilj[kljuc] - stanje[kljuc];
      if (Math.abs(razlika) > 0.01) {
        stanje[kljuc] += razlika * meko;
        mice = true;
      } else {
        stanje[kljuc] = cilj[kljuc];
      }
    }

    ploca.style.transform =
      'rotateX(' + stanje.nagib.toFixed(2) + 'deg)' +
      ' rotateZ(' + stanje.zaokret.toFixed(2) + 'deg)' +
      ' translateY(' + stanje.visina.toFixed(1) + 'px)';
    ploca.style.opacity = stanje.vidljivost.toFixed(3);

    redovi.forEach(red => {
      const smjer = Number(red.dataset.smjer) || 1;
      red.style.transform = 'translateX(' + (stanje.pomak * smjer).toFixed(1) + 'px)';
    });

    if (mice) requestAnimationFrame(korak);
    else radi = false;
  }

  addEventListener('scroll', () => {
    if (ceka) return;
    ceka = true;
    requestAnimationFrame(() => { ceka = false; postavi(); });
  }, { passive: true });

  addEventListener('resize', postavi);
  postavi();
})();
