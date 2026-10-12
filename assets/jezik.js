(function () {
  const KLJUC = 'jezik';
  const ATRIBUTI = ['placeholder', 'aria-label', 'title', 'alt'];
  const PRESKOCI = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'NOSCRIPT']);

  let jezik = 'sr';
  try { if (localStorage.getItem(KLJUC) === 'en') jezik = 'en'; } catch (g) {}

  const rjecnik = window.PREVOD_EN || {};
  const obrasci = window.PREVOD_EN_OBRASCI || [];

  function prevedi(tekst) {
    if (jezik !== 'en' || !tekst) return tekst;
    const cist = tekst.replace(/\s+/g, ' ').trim();
    if (!cist) return tekst;

    let novi = rjecnik[cist];
    if (novi === undefined) {
      const obrazac = obrasci.find(([re]) => re.test(cist));
      if (obrazac) novi = cist.replace(obrazac[0], obrazac[1]);
    }
    if (novi === undefined || novi === cist) return tekst;

    return tekst.match(/^\s*/)[0] + novi + tekst.match(/\s*$/)[0];
  }

  window.prevedi = prevedi;
  window.jezikStrane = jezik;

  function preskoci(cvor) {
    const roditelj = cvor.nodeType === 1 ? cvor : cvor.parentElement;
    return !roditelj || PRESKOCI.has(roditelj.tagName) || Boolean(roditelj.closest('[translate="no"]'));
  }

  function tekstCvor(cvor) {
    if (preskoci(cvor)) return;
    const novi = prevedi(cvor.nodeValue);
    if (novi !== cvor.nodeValue) cvor.nodeValue = novi;
  }

  function atributi(el) {
    if (preskoci(el)) return;
    ATRIBUTI.forEach(ime => {
      const staro = el.getAttribute(ime);
      if (!staro) return;
      const novo = prevedi(staro);
      if (novo !== staro) el.setAttribute(ime, novo);
    });
    if (el.tagName === 'INPUT' && /^(submit|button)$/.test(el.type) && el.value) {
      const novo = prevedi(el.value);
      if (novo !== el.value) el.value = novo;
    }
  }

  function prodji(korijen) {
    if (korijen.nodeType === 3) { tekstCvor(korijen); return; }
    if (korijen.nodeType !== 1) return;
    atributi(korijen);
    korijen.querySelectorAll('*').forEach(atributi);
    const setac = document.createTreeWalker(korijen, NodeFilter.SHOW_TEXT);
    const cvorovi = [];
    while (setac.nextNode()) cvorovi.push(setac.currentNode);
    cvorovi.forEach(tekstCvor);
  }

  function prekidac() {
    document.querySelectorAll('.jezik button').forEach(b => {
      b.setAttribute('aria-pressed', b.dataset.jezik === jezik ? 'true' : 'false');
      b.addEventListener('click', () => {
        if (b.dataset.jezik === jezik) return;
        try { localStorage.setItem(KLJUC, b.dataset.jezik); } catch (g) {}
        location.reload();
      });
    });
  }

  prekidac();
  if (jezik !== 'en') return;

  document.documentElement.lang = 'en';
  document.title = prevedi(document.title);
  const opis = document.querySelector('meta[name="description"]');
  if (opis) opis.content = prevedi(opis.content);
  prodji(document.body);

  new MutationObserver(promjene => {
    promjene.forEach(p => {
      if (p.type === 'childList') p.addedNodes.forEach(prodji);
      else if (p.type === 'characterData') tekstCvor(p.target);
      else if (p.type === 'attributes') atributi(p.target);
    });
  }).observe(document.body, {
    childList: true, subtree: true, characterData: true,
    attributes: true, attributeFilter: ATRIBUTI
  });
})();
