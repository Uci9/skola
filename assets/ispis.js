(function () {
  const mete = document.querySelectorAll('[data-ispis]');
  if (!mete.length) return;

  const smireno = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function razlomi(meta) {
    const setnja = document.createTreeWalker(meta, NodeFilter.SHOW_TEXT);
    const cvorovi = [];
    let c = setnja.nextNode();

    while (c) {
      if (c.nodeValue.trim()) cvorovi.push(c);
      c = setnja.nextNode();
    }

    const rijeci = [];

    cvorovi.forEach(cvor => {
      const dio = document.createDocumentFragment();
      cvor.nodeValue.split(/(\s+)/).forEach(komad => {
        if (!komad) return;
        if (!komad.trim()) {
          dio.appendChild(document.createTextNode(komad));
          return;
        }
        const s = document.createElement('span');
        s.textContent = komad;
        dio.appendChild(s);
        rijeci.push(s);
      });
      cvor.parentNode.replaceChild(dio, cvor);
    });

    return rijeci;
  }

  mete.forEach(meta => {
    if (smireno) return;

    const rijeci = razlomi(meta);
    if (!rijeci.length) return;

    meta.classList.add('ispis', 'cek');

    function pusti() {
      const razmak = Math.min(0.08, 2.8 / rijeci.length);
      meta.classList.add('tece');
      rijeci.forEach((rijec, i) => {
        rijec.style.transitionDelay = (i * razmak).toFixed(2) + 's';
      });
      requestAnimationFrame(() => meta.classList.remove('cek'));
    }

    if (!('IntersectionObserver' in window)) {
      pusti();
      return;
    }

    const oko = new IntersectionObserver((ulazi, obs) => {
      ulazi.forEach(u => {
        if (!u.isIntersecting) return;
        obs.disconnect();
        pusti();
      });
    }, { threshold: 0.35 });

    oko.observe(meta);
  });
})();
