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

  function pripremi(el) {
    if (el.dataset.spremno) return;
    el.dataset.spremno = '1';
    razbij(el, { n: 0 });
    el.classList.add('magla');
  }

  window.maglaPusti = function (korijen) {
    korijen.querySelectorAll('[data-magla]').forEach(el => {
      if (smireno) { el.classList.add('vidi'); return; }
      pripremi(el);
      el.classList.remove('vidi');
      void el.offsetWidth;
      el.classList.add('vidi');
    });
  };

  const sviNaslovi = [...document.querySelectorAll('[data-magla]')];
  const uPanelu = el => Boolean(el.closest('.panel'));

  if (smireno) {
    sviNaslovi.forEach(el => el.classList.add('vidi'));
  } else {
    sviNaslovi.forEach(pripremi);

    const oko = new IntersectionObserver((ulazi, obs) => {
      ulazi.forEach(u => {
        if (!u.isIntersecting) return;
        u.target.classList.add('vidi');
        obs.unobserve(u.target);
      });
    }, { threshold: .25 });

    sviNaslovi.forEach(el => {
      if (uPanelu(el) && !el.closest('.panel').classList.contains('on')) return;
      oko.observe(el);
    });
  }

  function sjeme(tekst) {
    let z = 7;
    for (const c of tekst) z = (z * 31 + c.charCodeAt(0)) % 99991;
    return () => {
      z = (z * 1103515245 + 12345) % 2147483648;
      return z / 2147483648;
    };
  }

  function svgUrl(sadrzaj, visina) {
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 " + visina +
      "' preserveAspectRatio='none'>" + sadrzaj + "</svg>";
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg).replace(/"/g, "'") + '")';
  }

  function potez(el) {
    if (el.dataset.nacrtano) return;
    el.dataset.nacrtano = '1';

    const boja = el.dataset.boja ||
      getComputedStyle(el).getPropertyValue('--isticaj').trim() || '#C9A66B';
    const slucaj = sjeme(el.textContent);

    if (el.dataset.akcija === 'oboji') {
      const g1 = 1 + slucaj() * 2.5;
      const g2 = 1 + slucaj() * 2;
      const d1 = 18 - slucaj() * 1.5;
      const d2 = 19 - slucaj() * 1.5;
      const oblik = "<path d='M0 " + g1 + " L100 " + g2 + " L100 " + d1 +
        " L0 " + d2 + " Z' fill='" + boja + "' opacity='.32'/>";
      el.style.backgroundImage = svgUrl(oblik, 20);
      el.style.setProperty('--potez-v', '1.15em');
      el.style.backgroundPosition = '0 50%';
    } else {
      const a = 7 + slucaj() * 1.2;
      const b = 10.5 - slucaj() * 1.5;
      const c = 5 + slucaj() * 1.5;
      const d = 7.5 + slucaj() * 1.2;
      const oblik =
        "<path d='M1.5 " + a + " C 28 " + b + ", 62 " + c + ", 98.5 " + d +
        "' fill='none' stroke='" + boja + "' stroke-width='2.6' stroke-linecap='round'/>" +
        "<path d='M5 " + (a + 2.2) + " C 34 " + (b + 1.4) + ", 68 " + (c + 2.4) +
        ", 95 " + (d + 1.6) + "' fill='none' stroke='" + boja +
        "' stroke-width='1.3' stroke-linecap='round' opacity='.5'/>";
      el.style.backgroundImage = svgUrl(oblik, 12);
      el.style.setProperty('--potez-v', '.42em');
      el.style.backgroundPosition = '0 100%';
    }
  }

  const istaknuto = [...document.querySelectorAll('.isticanje')];

  if (smireno) {
    istaknuto.forEach(el => { potez(el); el.classList.add('vidi'); });
  } else {
    const oko2 = new IntersectionObserver((ulazi, obs) => {
      ulazi.forEach(u => {
        if (!u.isIntersecting) return;
        potez(u.target);
        requestAnimationFrame(() => u.target.classList.add('vidi'));
        obs.unobserve(u.target);
      });
    }, { threshold: .6 });

    istaknuto.forEach(el => oko2.observe(el));
  }

})();
