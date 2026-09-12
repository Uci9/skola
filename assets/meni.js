(function () {
  const meni = document.getElementById('meni');
  if (!meni) return;
  if (!matchMedia('(min-width: 901px)').matches) return;

  const stavke = [...meni.querySelectorAll('.stavka')];
  if (!stavke.length) return;

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
    stavka.addEventListener('mouseenter', () => otvori(stavka));
    stavka.querySelector('button').addEventListener('click', ev => {
      ev.preventDefault();
      if (stavka.classList.contains('otvorena')) zatvori();
      else otvori(stavka);
    });
    stavka.addEventListener('focusin', () => otvori(stavka));
  });

  meni.addEventListener('mouseleave', () => {
    zatvaranje = setTimeout(zatvori, 120);
  });

  meni.addEventListener('focusout', ev => {
    if (!meni.contains(ev.relatedTarget)) zatvori();
  });

  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') zatvori();
  });
})();
