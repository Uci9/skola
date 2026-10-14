(function () {
  const KLJUC = 'jezik';
  const ATRIBUTI = ['placeholder', 'aria-label', 'title', 'alt'];
  const PRESKOCI = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'NOSCRIPT', 'CODE']);

  let jezik = 'lat';
  try {
    const sacuvan = localStorage.getItem(KLJUC);
    if (sacuvan === 'en' || sacuvan === 'cir') jezik = sacuvan;
  } catch (g) {}

  const rjecnik = window.PREVOD_EN || {};
  const obrasci = window.PREVOD_EN_OBRASCI || [];

  const SLOVA = {
    a: 'а', b: 'б', c: 'ц', č: 'ч', ć: 'ћ', d: 'д', đ: 'ђ', e: 'е', f: 'ф', g: 'г', h: 'х',
    i: 'и', j: 'ј', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', r: 'р', s: 'с', š: 'ш',
    t: 'т', u: 'у', v: 'в', z: 'з', ž: 'ж', ś: 'с́', ź: 'з́'
  };
  const DVOSLOVI = { lj: 'љ', nj: 'њ', dž: 'џ' };

  const OSTAJU = new Set([
    'moodle', 'instagram', 'facebook', 'youtube', 'google', 'gmail', 'android', 'vet', 'rcf',
    'western', 'balkans', 'challenge', 'fund', 'regional', 'word', 'excel', 'powerpoint',
    'pdf', 'ict', 'it', 'pib', 'made', 'by', 'uros', 'bukilic', 'eurocourt.net', 'eminentestate.me',
    'lat', 'en', 'v4wb', 'html', 'css', 'php', 'sql', 'wi-fi', 'wifi', 'usb', 'cad', 'auto'
  ]);
  const RIMSKI = /^(?=[IVXLCDM]+$)M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})\.?$/;

  function rijec(r) {
    if (!/[A-Za-zČčĆćĐđŠšŽžŚśŹź]/.test(r)) return r;
    if (/[qwxyQWXY@\/]|^www\.|\.(me|com|net|org|rs)$/.test(r)) return r;
    if (RIMSKI.test(r)) return r;
    if (OSTAJU.has(r.toLowerCase().replace(/[.,:;!?)]+$/, '').replace(/^[(„“"]+/, ''))) return r;

    let izlaz = '';
    for (let i = 0; i < r.length; i++) {
      const dva = r.slice(i, i + 2);
      const dvaMala = dva.toLowerCase();
      if (DVOSLOVI[dvaMala]) {
        const c = DVOSLOVI[dvaMala];
        izlaz += dva[0] === dva[0].toLowerCase() ? c : c.toUpperCase();
        i++;
        continue;
      }
      const s = r[i];
      const malo = s.toLowerCase();
      const c = SLOVA[malo];
      if (!c) { izlaz += s; continue; }
      izlaz += s === malo ? c : c.toUpperCase();
    }
    return izlaz;
  }

  function cirilicom(tekst) {
    return tekst.replace(/[^\s]+/g, rijec);
  }

  function engleski(tekst) {
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

  function prevedi(tekst) {
    if (!tekst || jezik === 'lat') return tekst;
    return jezik === 'en' ? engleski(tekst) : cirilicom(tekst);
  }

  window.prevedi = prevedi;
  window.jezikStrane = jezik === 'en' ? 'en' : 'sr';
  window.pismoStrane = jezik;

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
  if (jezik === 'lat') return;

  document.documentElement.lang = jezik === 'en' ? 'en' : 'sr-Cyrl-ME';
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
