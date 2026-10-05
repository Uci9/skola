(function () {
  const tipka = document.getElementById('cet-tipka');
  const prozor = document.getElementById('cet-prozor');
  if (!tipka || !prozor) return;

  function otvori(da) {
    if (da && !prozor.querySelector('iframe')) {
      const okvir = document.createElement('iframe');
      okvir.src = 'cet.html?mali';
      okvir.title = 'Školski čet';
      prozor.appendChild(okvir);
    }
    prozor.hidden = !da;
    tipka.classList.toggle('upaljen', da);
    tipka.setAttribute('aria-expanded', String(da));
    tipka.setAttribute('aria-label', da ? 'Zatvori čet' : 'Otvori čet');
  }

  tipka.addEventListener('click', () => otvori(prozor.hidden));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !prozor.hidden) otvori(false);
  });
})();
