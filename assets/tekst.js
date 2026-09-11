(function () {
  const smireno = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function razbij(cvor, brojac) {
    if (cvor.nodeType === 3) {
      const dio = document.createDocumentFragment();

      cvor.textContent.split(/(\s+)/).forEach(komad => {
        if (!komad) return;
        if (/^\s+$/.test(komad)) {
          dio.appendChild(document.createTextNode(komad));
          return;
        }
        const rijec = document.createElement('span');
        rijec.className = 'rijec';
        for (const znak of komad) {
          const s = document.createElement('span');
          s.className = 'slovo';
          s.style.setProperty('--r', brojac.n++);
          s.textContent = znak;
          rijec.appendChild(s);
        }
        dio.appendChild(rijec);
      });

      cvor.parentNode.replaceChild(dio, cvor);
      return;
    }
    if (cvor.nodeType === 1) {
      [...cvor.childNodes].forEach(d => razbij(d, brojac));
    }
  }

  const zaMagljenje = document.querySelectorAll('[data-magla]');

  if (smireno) {
    zaMagljenje.forEach(el => el.classList.add('vidi'));
  } else {
    zaMagljenje.forEach(el => {
      razbij(el, { n: 0 });
      el.classList.add('magla');
    });

    const oko = new IntersectionObserver((ulazi, obs) => {
      ulazi.forEach(u => {
        if (!u.isIntersecting) return;
        u.target.classList.add('vidi');
        obs.unobserve(u.target);
      });
    }, { threshold: .25 });

    zaMagljenje.forEach(el => oko.observe(el));
  }

  const istaknuto = document.querySelectorAll('.isticanje');

  if (smireno) {
    istaknuto.forEach(el => el.classList.add('vidi'));
  } else {
    const oko2 = new IntersectionObserver((ulazi, obs) => {
      ulazi.forEach(u => {
        if (!u.isIntersecting) return;
        u.target.classList.add('vidi');
        obs.unobserve(u.target);
      });
    }, { threshold: .9 });

    istaknuto.forEach(el => oko2.observe(el));
  }
})();
