(function () {
  const meni = document.getElementById('meni');
  if (!meni) return;

  const stavke = [...meni.querySelectorAll('.stavka')];
  if (!stavke.length) return;

  const siroko = matchMedia('(min-width: 901px)');
  let zatvaranje = null;

  function otvori(stavka) {
    clearTimeout(zatvaranje);
    stavke.forEach(s => {
      const ova = s === stavka;
      s.classList.toggle('otvorena', ova);
      s.querySelector('button').setAttribute('aria-expanded', ova ? 'true' : 'false');
    });
  }

  function zatvori() {
    stavke.forEach(s => {
      s.classList.remove('otvorena');
      s.querySelector('button').setAttribute('aria-expanded', 'false');
    });
  }

  stavke.forEach(stavka => {
    const tipka = stavka.querySelector('button');

    stavka.addEventListener('mouseenter', () => {
      if (siroko.matches) otvori(stavka);
    });

    tipka.addEventListener('click', ev => {
      ev.preventDefault();
      if (stavka.classList.contains('otvorena')) zatvori();
      else otvori(stavka);
    });

    stavka.addEventListener('focusin', () => {
      if (siroko.matches) otvori(stavka);
    });
  });

  meni.addEventListener('mouseleave', () => {
    if (!siroko.matches) return;
    zatvaranje = setTimeout(zatvori, 120);
  });

  meni.addEventListener('focusout', ev => {
    if (!siroko.matches) return;
    if (!meni.contains(ev.relatedTarget)) zatvori();
  });

  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') zatvori();
  });

  siroko.addEventListener('change', zatvori);
})();
