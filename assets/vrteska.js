(function () {
  const pozornica = document.getElementById('pozornica');
  const paluba = document.getElementById('paluba');
  if (!pozornica || !paluba) return;

  const sveKarte = [...paluba.querySelectorAll('.karta')];
  if (!sveKarte.length) return;

  const smireno = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let karte = sveKarte;
  let count = karte.length;

  const state = {
    phase: 3,
    target: 3,
    base: 3,
    pointerX: 0,
    pointerY: 0,
    active: false,
    lastInput: performance.now()
  };

  function wrappedDelta(index, phase) {
    let delta = index - phase;
    while (delta > count / 2) delta -= count;
    while (delta < -count / 2) delta += count;
    return delta;
  }

  function nearestIndex() {
    return (Math.round(state.phase) % count + count) % count;
  }

  function moveTo(index) {
    const current = nearestIndex();
    let delta = index - current;
    if (delta > count / 2) delta -= count;
    if (delta < -count / 2) delta += count;
    state.base += delta;
    state.target = state.base;
    state.active = false;
    state.lastInput = performance.now();
  }

  window.vrteskaNa = moveTo;

  sveKarte.forEach(karta => {
    karta.addEventListener('click', () => {
      const mjesto = karte.indexOf(karta);
      if (mjesto < 0) return;
      if (mjesto === nearestIndex()) {
        if (window.otvoriBio) window.otvoriBio(karta);
      } else {
        moveTo(mjesto);
      }
    });
    karta.addEventListener('focus', () => {
      const mjesto = karte.indexOf(karta);
      if (mjesto >= 0) moveTo(mjesto);
    });
  });

  pozornica.addEventListener('pointermove', event => {
    const rect = pozornica.getBoundingClientRect();
    const nx = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
    const ny = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2));
    if (event.pointerType === 'touch' && !povlacim) return;
    state.pointerX = nx;
    state.pointerY = ny;
    state.active = true;
    state.target = state.base + nx * 3.1;
    state.lastInput = performance.now();
    pozornica.style.setProperty('--pointer-x', ((nx + 1) * 50) + '%');
  });

  pozornica.addEventListener('pointerleave', smiri);

  function smiri() {
    state.active = false;
    state.pointerX = 0;
    state.pointerY = 0;
    state.target = state.base;
    pozornica.style.setProperty('--pointer-x', '50%');
  }

  let povlacim = false;
  let pocetakX = 0;
  let pocetnaBaza = 3;

  pozornica.addEventListener('pointerdown', event => {
    povlacim = true;
    pocetakX = event.clientX;
    pocetnaBaza = state.base;
    pozornica.classList.add('vuce');
  });

  pozornica.addEventListener('pointermove', event => {
    if (!povlacim) return;
    const rect = pozornica.getBoundingClientRect();
    const pomak = (event.clientX - pocetakX) / rect.width;
    state.base = pocetnaBaza - pomak * count * 0.42;
    state.target = state.base;
    state.active = false;
    state.lastInput = performance.now();
  });

  function pusti() {
    if (!povlacim) return;
    povlacim = false;
    pozornica.classList.remove('vuce');
    state.base = Math.round(state.base);
    state.target = state.base;
  }

  pozornica.addEventListener('pointerup', pusti);
  pozornica.addEventListener('pointercancel', pusti);

  pozornica.addEventListener('wheel', event => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    event.preventDefault();
    const direction = Math.sign(event.deltaX);
    if (!direction) return;
    state.base += direction;
    state.target = state.base;
    state.active = false;
    state.lastInput = performance.now();
  }, { passive: false });

  pozornica.addEventListener('keydown', event => {
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
    const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
    if (!forward && !backward) return;
    event.preventDefault();
    state.base += forward ? 1 : -1;
    state.target = state.base;
    state.active = false;
    state.lastInput = performance.now();
  });

  const natpisIme = document.getElementById('natpisIme');
  const natpisUloga = document.getElementById('natpisUloga');
  const natpisBroj = document.getElementById('natpisBroj');
  let zadnjiAktivan = -1;

  window.vrteskaFiltriraj = function (nadjene) {
    sveKarte.forEach(k => { k.hidden = !nadjene.includes(k); });
    karte = nadjene.length ? nadjene : sveKarte;
    count = karte.length;
    state.base = Math.min(3, count - 1);
    if (state.base < 0) state.base = 0;
    state.phase = state.base;
    state.target = state.base;
    zadnjiAktivan = -1;
  };

  let previousTime = performance.now();

  function render(time) {
    const deltaTime = Math.min(32, time - previousTime);
    previousTime = time;
    const ease = smireno ? 1 : 1 - Math.pow(0.001, deltaTime / 1000);

    if (count > 2 && !state.active && !povlacim && time - state.lastInput > 3600) {
      const idle = time - state.lastInput - 3600;
      state.target = state.base + Math.sin(idle * 0.00042) * 2.45;
    }

    state.phase += (state.target - state.phase) * ease;
    const compact = innerWidth < 650;
    const activeIndex = nearestIndex();
    const horizontalSpacing = compact
      ? Math.min(126, Math.max(84, innerWidth * 0.25))
      : Math.min(168, Math.max(112, innerWidth * 0.116));

    karte.forEach((card, index) => {
      const delta = wrappedDelta(index, state.phase);
      const distance = Math.abs(delta);

      if (distance > 9) {
        if (!card.dataset.mirno) {
          card.style.visibility = 'hidden';
          card.dataset.mirno = '1';
        }
        return;
      }
      if (card.dataset.mirno) {
        card.style.visibility = '';
        delete card.dataset.mirno;
      }

      const focus = Math.exp(-distance * distance * 1.28);
      const side = Math.max(0, 1 - distance / 5);
      const direction = Math.sign(delta);
      const daleko = distance > 6 ? Math.max(0, 1 - (distance - 6) / 3) : 1;
      const x = delta * horizontalSpacing;
      const y = distance * 8 + state.pointerY * focus * 10;
      const z = focus * 145 - distance * 148;
      const scale = 0.54 + side * 0.15 + focus * 0.54;
      const rotateX = -state.pointerY * focus * 3.5;
      const rotateY = -direction * (distance > 0.2 ? 14 + Math.min(distance, 3) * 5 : 0)
        + state.pointerX * focus * 3;
      const rotateZ = delta * 0.7;

      card.style.setProperty('--focus', focus.toFixed(4));
      card.style.zIndex = String(Math.round(1000 - distance * 100));
      card.style.opacity = String(Math.max(0.13, side * 0.76 + focus * 0.24) * daleko);
      card.style.filter = 'blur(' + (Math.max(0, distance - 1.5) * 0.38).toFixed(2) + 'px)';
      card.style.transform = [
        'translate(-50%, -50%)',
        'translate3d(' + x.toFixed(2) + 'px, ' + y.toFixed(2) + 'px, ' + z.toFixed(2) + 'px)',
        'rotateX(' + rotateX.toFixed(2) + 'deg)',
        'rotateY(' + rotateY.toFixed(2) + 'deg)',
        'rotateZ(' + rotateZ.toFixed(2) + 'deg)',
        'scale(' + scale.toFixed(4) + ')'
      ].join(' ');
      card.setAttribute('aria-current', index === activeIndex ? 'true' : 'false');
    });

    if (activeIndex !== zadnjiAktivan && karte[activeIndex]) {
      zadnjiAktivan = activeIndex;
      const k = karte[activeIndex];
      if (natpisIme) natpisIme.textContent = k.dataset.ime;
      if (natpisUloga) natpisUloga.textContent = k.dataset.zvanje;
      if (natpisBroj) natpisBroj.textContent = String(activeIndex + 1).padStart(2, '0') + ' / ' + String(count).padStart(2, '0');
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
})();
