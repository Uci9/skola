(function () {
  const okviri = document.querySelectorAll('[data-leca]');
  if (!okviri.length) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const UVECANJE = 2;
  const PRECNIK = 150;

  okviri.forEach(okvir => {
    const slika = okvir.querySelector('img');
    if (!slika) return;

    const leca = document.createElement('span');
    leca.className = 'leca';
    leca.setAttribute('aria-hidden', 'true');
    okvir.appendChild(leca);

    let mjera = null;

    function osvjezi() {
      mjera = okvir.getBoundingClientRect();
    }

    function pomjeri(x, y) {
      if (!mjera) osvjezi();
      const lx = x - mjera.left;
      const ly = y - mjera.top;

      leca.style.left = lx + 'px';
      leca.style.top = ly + 'px';
      leca.style.backgroundImage = 'url("' + slika.currentSrc + '")';
      leca.style.backgroundSize = (mjera.width * UVECANJE) + 'px ' + (mjera.height * UVECANJE) + 'px';
      leca.style.backgroundPosition =
        (-lx * UVECANJE + PRECNIK / 2) + 'px ' + (-ly * UVECANJE + PRECNIK / 2) + 'px';
    }

    okvir.addEventListener('pointerenter', e => {
      osvjezi();
      pomjeri(e.clientX, e.clientY);
      okvir.classList.add('sa-lecom');
    });

    okvir.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      pomjeri(e.clientX, e.clientY);
    });

    okvir.addEventListener('pointerleave', () => {
      okvir.classList.remove('sa-lecom');
    });

    okvir.addEventListener('touchstart', e => {
      osvjezi();
      const t = e.touches[0];
      pomjeri(t.clientX, t.clientY);
      okvir.classList.add('sa-lecom');
    }, { passive: true });

    okvir.addEventListener('touchmove', e => {
      const t = e.touches[0];
      pomjeri(t.clientX, t.clientY);
    }, { passive: true });

    okvir.addEventListener('touchend', () => {
      okvir.classList.remove('sa-lecom');
    });

    window.addEventListener('resize', osvjezi);
  });
})();
