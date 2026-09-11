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

  const NS = 'http://www.w3.org/2000/svg';

  function sjeme(tekst) {
    let z = 7;
    for (const c of tekst) z = (z * 31 + c.charCodeAt(0)) % 99991;
    return () => {
      z = (z * 1103515245 + 12345) % 2147483648;
      return z / 2147483648;
    };
  }

  function potez(el) {
    if (el.dataset.nacrtano) return;
    const okviri = [...el.getClientRects()];
    if (!okviri.length) return;
    el.dataset.nacrtano = '1';

    const svoj = el.getBoundingClientRect();
    const akcija = el.dataset.akcija === 'oboji' ? 'oboji' : 'podvuci';
    const boja = el.dataset.boja ||
      getComputedStyle(el).getPropertyValue('--isticaj').trim() || '#0E8F7E';
    const slucaj = sjeme(el.textContent);

    okviri.forEach((o, i) => {
      const w = o.width, h = o.height;
      if (w < 4) return;

      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'potez');
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + (h + 8));
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('aria-hidden', 'true');
      svg.style.left = (o.left - svoj.left - 3) + 'px';
      svg.style.top = (o.top - svoj.top - 2) + 'px';
      svg.style.width = (w + 6) + 'px';
      svg.style.height = (h + 8) + 'px';
      svg.style.animationDelay = (i * 90) + 'ms';

      if (akcija === 'podvuci') {
        const y = h + 1;
        const a = 1 + slucaj() * 1.5;
        const b = y - 1 - slucaj() * 2.5;
        const c = y + 1 + slucaj() * 1.5;
        const d = y - slucaj() * 2;
        const put = document.createElementNS(NS, 'path');
        put.setAttribute('d',
          'M ' + a + ' ' + b +
          ' C ' + (w * 0.3) + ' ' + (b + 2.5) +
          ', ' + (w * 0.62) + ' ' + (c - 3) +
          ', ' + (w - 1) + ' ' + d);
        put.setAttribute('fill', 'none');
        put.setAttribute('stroke', boja);
        put.setAttribute('stroke-width', '3.2');
        put.setAttribute('stroke-linecap', 'round');
        svg.appendChild(put);

        const drugi = put.cloneNode();
        drugi.setAttribute('d',
          'M ' + (a + 3) + ' ' + (b + 2.2) +
          ' C ' + (w * 0.38) + ' ' + (b + 4.2) +
          ', ' + (w * 0.7) + ' ' + (c - 0.6) +
          ', ' + (w - 4) + ' ' + (d + 1.8));
        drugi.setAttribute('stroke-width', '1.6');
        drugi.setAttribute('opacity', '.55');
        svg.appendChild(drugi);
      } else {
        const gore = 2 + slucaj() * 2.5;
        const dolje = h + 1 - slucaj() * 1.5;
        const put = document.createElementNS(NS, 'path');
        put.setAttribute('d',
          'M 0 ' + (gore + 2.5) +
          ' L ' + (w * 0.985) + ' ' + gore +
          ' L ' + w + ' ' + dolje +
          ' L ' + (w * 0.012) + ' ' + (dolje + 2) + ' Z');
        put.setAttribute('fill', boja);
        put.setAttribute('opacity', '.34');
        svg.appendChild(put);
      }

      el.appendChild(svg);
    });
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
    }, { threshold: .85 });

    istaknuto.forEach(el => oko2.observe(el));
  }
})();
