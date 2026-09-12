(function () {
  const omot = document.getElementById('blok');
  if (!omot) return;

  const scena = document.getElementById('blok-scena');
  const okvir3d = document.getElementById('blok-3d');
  const knjiga = document.getElementById('blok-knjiga');
  const kutijaNatpisa = document.getElementById('blok-natpisi');
  const savjet = document.getElementById('blok-savjet');
  const spisak = document.getElementById('blok-spisak');
  const rezerva = document.getElementById('blok-rezerva');
  const ispod = document.getElementById('blok-ispod');
  if (!scena || !okvir3d || !knjiga) return;

  const STRANE = [
    {
      nadnaslov: 'Prva strana',
      naslov: 'Od 1946.',
      redovi: [
        'Škola na ovoj adresi radi od 1946. godine. Kroz nju je prošlo više generacija električara, monterâ i tehničara nego što iko u Podgorici može da nabroji.',
        'Danas se zove JU Srednja elektrotehnička škola „Vaso Aligrudić“ — osamdeset godina jedne struke, od prvih instalacija do mreža i mikrokontrolera.'
      ],
      slika: 'assets/img/skola.jpg',
      potpis: 'Zgrada škole, Vasa Raičkovića 26',
      mjesto: 'Podgorica'
    },
    {
      nadnaslov: 'Brojke',
      naslov: 'Šta smo danas',
      redovi: [
        'Šest obrazovnih programa — četiri četvorogodišnja i dva trogodišnja. Sedamdeset tri nastavnika i stotinu zaposlenih.',
        'Četvorogodišnji vode ka diplomi tehničara i pravu na fakultet. Trogodišnji ka zanimanju s kojim se odmah radi.'
      ],
      slika: 'assets/kadrovi/l/k052.jpg',
      potpis: 'Fasada iz dvorišta',
      mjesto: 'Dvorište'
    },
    {
      nadnaslov: 'Program',
      naslov: 'Računari i elektronika',
      redovi: [
        'Elektrotehničar računara — hardver, mreže, operativni sistemi i programiranje. Dva odjeljenja, četiri godine, stručna matura.',
        'Elektrotehničar elektronike — analogna i digitalna elektronika, mikrokontroleri, mjerenja i projektovanje uređaja.'
      ],
      slika: 'assets/kadrovi/l/k104.jpg',
      potpis: 'Ulaz u školu',
      mjesto: 'Ulaz'
    },
    {
      nadnaslov: 'Program',
      naslov: 'Energetika i veze',
      redovi: [
        'Elektrotehničar energetike — proizvodnja, prenos i distribucija struje, instalacije i mašine, obnovljivi izvori. Dva odjeljenja.',
        'Elektrotehničar telekomunikacija — prenos signala, optičke i bežične mreže, održavanje sistema, uz praksu kod operatera.'
      ],
      slika: 'assets/kadrovi/l/k030.jpg',
      potpis: 'Prilaz od kapije do vrata',
      mjesto: 'Prilaz'
    },
    {
      nadnaslov: 'Program',
      naslov: 'Zanat u tri godine',
      redovi: [
        'Elektroinstalater — izvođenje i održavanje instalacija u objektima, uz praksu kod poslodavaca.',
        'Elektromehaničar — montaža, servis i popravka uređaja i mašina, dijelom kroz dualno obrazovanje. Oba programa završavaju stručnim ispitom.'
      ],
      slika: 'assets/kadrovi/l/k078.jpg',
      potpis: 'Nadstrešnica pred ulazom',
      mjesto: 'Trijem'
    },
    {
      nadnaslov: 'Praksa',
      naslov: 'Uči se u pogonu',
      redovi: [
        'Dio nastave se odvija kod poslodavaca — u pogonima, a ne u učionici. Kod trogodišnjih programa i kroz dualno obrazovanje.',
        'Učenici i nastavnici izlaze na domaća i međunarodna takmičenja.'
      ],
      slika: 'assets/kadrovi/l/k004.jpg',
      potpis: 'Klupe ispred ulaza',
      mjesto: 'Dvorište'
    },
    {
      nadnaslov: 'Projekti',
      naslov: 'Ne radimo sami',
      redovi: [
        'Kroz VET for Western Balkans škola radi sa zemljama Zapadnog Balkana i članicama Evropske unije — zajedničke radne grupe i razvoj nastavnog plana.',
        'Kroz Regionalni Challenge Fond stiže oprema i infrastruktura, uz preduzeća koja uzimaju učenike na obuku.'
      ],
      slika: 'assets/kadrovi/l/k138.jpg',
      potpis: 'Tabla sa nazivom škole',
      mjesto: 'Tabla'
    },
    {
      nadnaslov: 'Posljednja strana',
      naslov: 'I sa odraslima',
      redovi: [
        'Škola je licencirana za obrazovanje odraslih u tri oblasti: elektronski sigurnosni sistemi, elektrokomunikacioni sistemi i održavanje elektronskih uređaja.',
        'Sekretarijat radi ponedjeljkom do petka, 08.00—14.00.'
      ],
      slika: 'assets/kadrovi/l/k124.jpg',
      potpis: 'Kraj smjene',
      mjesto: 'Škola'
    }
  ];

  const BROJ = STRANE.length;
  const DOCEK = 3;
  const smireno = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SIRINA = 1400;
  const VISINA = 986;
  const LIJEVI = 0.051;
  const DESNI = 0.949;
  const GORNJI = 0.218;
  const DONJI = 0.782;

  function ucitajSliku(putanja) {
    return new Promise(kraj => {
      const s = new Image();
      s.onload = () => kraj(s);
      s.onerror = () => kraj(null);
      s.src = putanja;
    });
  }

  function papir(k, x, y, s, v) {
    const preliv = k.createLinearGradient(x, y, x + s, y);
    preliv.addColorStop(0, '#F3EDDF');
    preliv.addColorStop(0.46, '#FBF7EC');
    preliv.addColorStop(0.5, '#F1EADA');
    preliv.addColorStop(0.54, '#FBF7EC');
    preliv.addColorStop(1, '#F3EDDF');

    k.save();
    k.shadowColor = 'rgba(48,36,18,.28)';
    k.shadowBlur = 26;
    k.shadowOffsetY = 10;
    k.fillStyle = preliv;
    k.beginPath();
    k.roundRect(x, y, s, v, 7);
    k.fill();
    k.restore();

    k.save();
    k.beginPath();
    k.roundRect(x, y, s, v, 7);
    k.clip();

    const sredina = x + s / 2;
    const prevoj = k.createLinearGradient(sredina - 46, 0, sredina + 46, 0);
    prevoj.addColorStop(0, 'rgba(86,66,34,0)');
    prevoj.addColorStop(0.5, 'rgba(86,66,34,.20)');
    prevoj.addColorStop(1, 'rgba(86,66,34,0)');
    k.fillStyle = prevoj;
    k.fillRect(sredina - 46, y, 92, v);

    k.fillStyle = 'rgba(96,78,46,.055)';
    for (let i = 0; i < 2600; i++) {
      const tx = x + Math.random() * s;
      const ty = y + Math.random() * v;
      k.fillRect(tx, ty, 1, 1);
    }

    k.strokeStyle = 'rgba(72,56,30,.16)';
    k.lineWidth = 1;
    k.beginPath();
    k.moveTo(sredina, y + 10);
    k.lineTo(sredina, y + v - 10);
    k.stroke();
    k.restore();
  }

  function lomi(k, tekst, sirina) {
    const rijeci = tekst.split(' ');
    const redovi = [];
    let red = '';

    rijeci.forEach(rijec => {
      const proba = red ? red + ' ' + rijec : rijec;
      if (k.measureText(proba).width > sirina && red) {
        redovi.push(red);
        red = rijec;
      } else {
        red = proba;
      }
    });

    if (red) redovi.push(red);
    return redovi;
  }

  function crtajStranu(k, strana, x, y, s, v) {
    const uvlaka = 46;
    const px = x + uvlaka;
    const py = y + uvlaka;
    const ps = s - uvlaka * 2;
    let vrh = py + 16;

    k.fillStyle = 'rgba(64,50,26,.55)';
    k.font = '500 15px "Instrument Sans", sans-serif';
    k.fillText(strana.nadnaslov.toUpperCase(), px, vrh);
    vrh += 34;

    k.fillStyle = '#2B2721';
    k.font = 'italic 46px "Instrument Serif", Georgia, serif';
    k.fillText(strana.naslov, px, vrh + 18);
    vrh += 58;

    k.strokeStyle = 'rgba(72,56,30,.22)';
    k.lineWidth = 1;
    k.beginPath();
    k.moveTo(px, vrh);
    k.lineTo(px + ps * 0.44, vrh);
    k.stroke();
    vrh += 34;

    k.fillStyle = 'rgba(43,39,33,.88)';
    k.font = '400 19px "Instrument Sans", sans-serif';

    strana.redovi.forEach(red => {
      lomi(k, red, ps).forEach(dio => {
        k.fillText(dio, px, vrh);
        vrh += 31;
      });
      vrh += 16;
    });
  }

  function crtajSliku(k, slika, strana, x, y, s, v) {
    const uvlaka = 42;
    const rx = x + uvlaka;
    const ry = y + uvlaka;
    const rs = s - uvlaka * 2;
    const rv = v - uvlaka * 2 - 34;

    k.save();
    k.beginPath();
    k.roundRect(rx, ry, rs, rv, 4);
    k.clip();

    if (slika) {
      const odnos = Math.max(rs / slika.naturalWidth, rv / slika.naturalHeight);
      const sw = slika.naturalWidth * odnos;
      const sv = slika.naturalHeight * odnos;
      k.drawImage(slika, rx + (rs - sw) / 2, ry + (rv - sv) / 2, sw, sv);
      k.fillStyle = 'rgba(236,231,220,.16)';
      k.fillRect(rx, ry, rs, rv);
    } else {
      k.fillStyle = '#E4DCC8';
      k.fillRect(rx, ry, rs, rv);
    }

    k.restore();

    k.strokeStyle = 'rgba(64,48,24,.35)';
    k.lineWidth = 1.5;
    k.beginPath();
    k.roundRect(rx - 0.5, ry - 0.5, rs + 1, rv + 1, 4);
    k.stroke();

    k.fillStyle = 'rgba(64,50,26,.62)';
    k.font = 'italic 17px "Instrument Serif", Georgia, serif';
    k.fillText(strana.potpis, rx, ry + rv + 24);
  }

  async function napraviStranu(strana) {
    const platno = document.createElement('canvas');
    platno.width = SIRINA;
    platno.height = VISINA;
    const k = platno.getContext('2d');

    const x = SIRINA * LIJEVI;
    const s = SIRINA * (DESNI - LIJEVI);
    const y = VISINA * GORNJI;
    const v = VISINA * (DONJI - GORNJI);

    papir(k, x, y, s, v);

    const slika = await ucitajSliku(strana.slika);
    crtajStranu(k, strana, x, y, s / 2, v);
    crtajSliku(k, slika, strana, x + s / 2, y, s / 2, v);

    return new Promise(kraj => {
      platno.toBlob(dio => {
        kraj(dio ? URL.createObjectURL(dio) : platno.toDataURL('image/png'));
      }, 'image/webp', 0.9);
    });
  }

  const N = 18;
  const RASPON = 0.449;
  const BETA = 0.60;

  let idx = 0;
  let okret = null;
  let pojasevi = [];

  function el(vrsta, razred) {
    const e = document.createElement(vrsta);
    if (razred) e.className = razred;
    return e;
  }

  function slikaEl(i, strana) {
    const s = new Image();
    s.className = 'blok-pola-slika ' + strana;
    s.draggable = false;
    s.alt = '';
    s.src = STRANE[i].url;
    return s;
  }

  function polaEl(strana, i) {
    const d = el('div', 'blok-pola ' + strana);
    d.appendChild(slikaEl(i, strana));
    d.appendChild(el('div', 'blok-prevoj ' + strana));
    return d;
  }

  function napraviUvijanje(smjer, od, na) {
    pojasevi = [];
    const c = el('div', 'uvijanje ' + smjer);
    c.style.setProperty('--broj', N);
    c.style.setProperty('--raspon', RASPON);
    let domacin = c;

    for (let i = 0; i < N; i++) {
      const p = el('div', 'pojas');
      const prevoj = 'calc(var(--sirina) * 0.5)';
      const sirinaPojasa = 'calc(var(--sirina) * ' + RASPON + ' / ' + N + ')';
      const A = 'calc(-1 * (' + prevoj + ' + ' + i + ' * ' + sirinaPojasa + '))';
      const B = 'calc(' + (i + 1) + ' * ' + sirinaPojasa + ' - ' + prevoj + ')';
      const prednje = el('div', 'lice prednje');
      const zadnje = el('div', 'lice zadnje');

      const obuci = (e, adresa, px) => {
        e.style.backgroundImage = 'url(' + adresa + ')';
        e.style.backgroundPositionX = px;
      };

      obuci(prednje, STRANE[od].url, smjer === 'dalje' ? A : B);
      obuci(zadnje, STRANE[na].url, smjer === 'dalje' ? B : A);

      prednje.appendChild(el('div', 'sj'));
      prednje.appendChild(el('div', 'sjaj'));
      zadnje.appendChild(el('div', 'sj'));
      zadnje.appendChild(el('div', 'sjaj'));
      p.appendChild(prednje);
      p.appendChild(zadnje);

      if (i === N - 1) p.classList.add('ivica');
      domacin.appendChild(p);
      domacin = p;
      pojasevi.push(p);
    }

    return c;
  }

  function primijeni(t) {
    const ugao = Math.PI * t;
    const beta = BETA * Math.sin(Math.PI * t);
    const S = 180 / Math.PI;
    const uk = ugao + beta;
    const korak = 2 * beta / N;

    okvir3d.style.setProperty('--ugao', (uk * S).toFixed(2) + 'deg');
    okvir3d.style.setProperty('--korak', (korak * S).toFixed(3) + 'deg');
    okvir3d.style.setProperty('--sjena', Math.sin(Math.PI * t).toFixed(3));
    blijedi(t);

    for (let i = 0; i < pojasevi.length; i++) {
      const s1 = Math.abs(Math.cos(uk - i * korak));
      const s2 = Math.abs(Math.cos(uk - (i + 1) * korak));
      const st = pojasevi[i].style;
      st.setProperty('--svjetlo', s1.toFixed(3));
      st.setProperty('--a1', ((1 - s1) * .62).toFixed(3));
      st.setProperty('--a2', ((1 - s2) * .62).toFixed(3));
    }
  }

  function iscrtaj() {
    knjiga.textContent = '';

    if (!okret) {
      const c = el('div', 'blok-cijela');
      const s = new Image();
      s.src = STRANE[idx].url;
      s.alt = STRANE[idx].naslov;
      s.draggable = false;
      c.appendChild(s);
      knjiga.appendChild(c);
      okvir3d.style.setProperty('--sjena', '0');
    } else {
      const dalje = okret.smjer === 'dalje';
      knjiga.appendChild(polaEl('lijevo', dalje ? okret.od : okret.na));
      knjiga.appendChild(polaEl('desno', dalje ? okret.na : okret.od));
      knjiga.appendChild(napraviUvijanje(okret.smjer, okret.od, okret.na));
      primijeni(okret.t);
    }

    const a = el('button', 'blok-zona nazad');
    const b = el('button', 'blok-zona dalje');
    a.type = 'button';
    b.type = 'button';
    a.setAttribute('aria-label', 'prethodna strana');
    b.setAttribute('aria-label', 'sljedeća strana');
    knjiga.appendChild(a);
    knjiga.appendChild(b);

    razmjeri();
    natpis();
    prepisi();
    oznaci();
    preslikajZum();
    postaviLupu();
  }

  function prepisi() {
    if (!ispod) return;
    const strana = STRANE[okret ? okret.na : idx];
    ispod.textContent = '';

    const nad = document.createElement('b');
    nad.textContent = strana.nadnaslov;
    ispod.appendChild(nad);

    const naslov = document.createElement('h3');
    naslov.textContent = strana.naslov;
    ispod.appendChild(naslov);

    strana.redovi.forEach(red => {
      const p = document.createElement('p');
      p.textContent = red;
      ispod.appendChild(p);
    });

    const potpis = document.createElement('p');
    potpis.className = 'blok-potpis';
    potpis.textContent = strana.potpis;
    ispod.appendChild(potpis);
  }

  let natpisVan = null;
  let natpisUnutra = null;

  function natpis() {
    kutijaNatpisa.textContent = '';
    natpisVan = null;
    natpisUnutra = null;

    if (okret) {
      natpisVan = el('p', 'blok-natpis zivi');
      natpisVan.textContent = STRANE[okret.od].naslov;
      kutijaNatpisa.appendChild(natpisVan);
      natpisUnutra = el('p', 'blok-natpis zivi');
      natpisUnutra.textContent = STRANE[okret.na].naslov;
      kutijaNatpisa.appendChild(natpisUnutra);
      blijedi(okret.t);
    } else {
      const p = el('p', 'blok-natpis');
      p.textContent = STRANE[idx].naslov;
      kutijaNatpisa.appendChild(p);
    }
  }

  function blijedi(t) {
    if (!natpisVan || !natpisUnutra) return;
    const van = 1 - Math.max(0, Math.min(1, (t - 0.10) / 0.28));
    const unutra = Math.max(0, Math.min(1, (t - 0.56) / 0.30));
    natpisVan.style.opacity = van.toFixed(3);
    natpisUnutra.style.opacity = unutra.toFixed(3);
  }

  function razmjeri() {
    okvir3d.style.setProperty('--sirina', knjiga.clientWidth + 'px');
  }

  addEventListener('resize', razmjeri);

  let opruga = null;
  let kadar = null;
  let posljednji = 0;

  function idiNa(cilj, poslije, krutost, prigusenje) {
    opruga = { vrsta: 'opruga', v: 0, cilj: cilj, kraj: poslije, k: krutost || 150, c: prigusenje || 22 };
    gurni();
  }

  function prevuciNa(cilj, trajanje, poslije) {
    opruga = { vrsta: 'hod', od: okret ? okret.t : 0, cilj: cilj, trajanje: trajanje, prot: 0, kraj: poslije };
    gurni();
  }

  function otkucaj(sada) {
    kadar = null;
    const dt = Math.min(0.032, (sada - posljednji) / 1000 || 0.016);
    posljednji = sada;

    if (opruga && okret) {
      const o = opruga;
      if (o.vrsta === 'hod') {
        o.prot += dt;
        const k = Math.min(1, o.prot / o.trajanje);
        okret.t = o.od + (o.cilj - o.od) * k;
        primijeni(okret.t);
        if (k >= 1) {
          opruga = null;
          if (o.kraj) o.kraj();
        }
      } else {
        const x = okret.t - o.cilj;
        o.v += (-o.k * x - o.c * o.v) * dt;
        okret.t += o.v * dt;
        if (Math.abs(okret.t - o.cilj) < 0.002 && Math.abs(o.v) < 0.02) {
          okret.t = o.cilj;
          opruga = null;
          primijeni(okret.t);
          if (o.kraj) o.kraj();
        } else {
          primijeni(okret.t);
        }
      }
    }

    const gleda = pogled();
    const lupaMice = smiriLupu();

    if ((opruga || gleda || lupaMice) && kadar === null) kadar = requestAnimationFrame(otkucaj);
  }

  function gurni() {
    if (kadar === null) {
      posljednji = performance.now();
      kadar = requestAnimationFrame(otkucaj);
    }
  }

  const NAGIB_X = 4.5;
  const NAGIB_Y = 7;
  const ZUM_MANJI = 0.9;
  const ZUM_VECI = 1.5;
  const vid = { rx: 0, ry: 0, z: 1, crx: 0, cry: 0, cz: 1 };
  let gledaRadi = false;
  let zadnjiZ = 1;

  function primijeniPogled() {
    okvir3d.style.setProperty('--rx', vid.rx.toFixed(2) + 'deg');
    okvir3d.style.setProperty('--ry', vid.ry.toFixed(2) + 'deg');
    okvir3d.style.setProperty('--zum', vid.z.toFixed(3));
    if (vid.z !== zadnjiZ) {
      zadnjiZ = vid.z;
      postaviLupu();
    }
  }

  function pogled() {
    const e = 0.14;
    let mice = false;

    [['rx', 'crx'], ['ry', 'cry'], ['z', 'cz']].forEach(par => {
      const razlika = vid[par[1]] - vid[par[0]];
      if (Math.abs(razlika) > 0.0006) {
        vid[par[0]] += razlika * e;
        mice = true;
      } else {
        vid[par[0]] = vid[par[1]];
      }
    });

    if (mice) primijeniPogled();
    gledaRadi = mice;
    return mice;
  }

  function postaviPogled(rx, ry, z) {
    vid.crx = Math.max(-NAGIB_X, Math.min(NAGIB_X, rx));
    vid.cry = Math.max(-NAGIB_Y, Math.min(NAGIB_Y, ry));
    vid.cz = Math.max(ZUM_MANJI, Math.min(ZUM_VECI, z));
    gledaRadi = true;
    gurni();
    osvjeziZum();
  }

  function nagniKa(cx, cy) {
    if (vuci) return;
    const m = knjiga.getBoundingClientRect();
    if (!m.width) return;
    const nx = Math.max(-1, Math.min(1, (cx - (m.left + m.width / 2)) / (m.width * 0.62)));
    const ny = Math.max(-1, Math.min(1, (cy - (m.top + m.height / 2)) / (m.height * 0.9)));
    postaviPogled(-ny * NAGIB_X, nx * NAGIB_Y, vid.cz);
  }

  addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const m = okvir3d.getBoundingClientRect();
    if (m.bottom < 0 || m.top > innerHeight) return;
    nagniKa(e.clientX, e.clientY);
  }, { passive: true });

  addEventListener('blur', () => postaviPogled(0, 0, vid.cz));
  scena.addEventListener('dblclick', () => postaviPogled(vid.crx, vid.cry, 1));

  let vuci = null;

  function sakrijSavjet() {
    if (savjet) savjet.classList.add('nema');
  }

  scena.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    e.preventDefault();
    const naKnjizi = e.target.closest('.blok-zona');
    scena.setPointerCapture(e.pointerId);
    sakrijSavjet();
    if (!naKnjizi || uvodRadi) return;

    const m = knjiga.getBoundingClientRect();
    const smjer = (e.clientX - m.left) / m.width > 0.5 ? 'dalje' : 'nazad';
    zapocni(smjer, 0);
    vuci = { smjer: smjer, x0: e.clientX, s: m.width, hod: 0, brzina: 0, kada: performance.now() };
  });

  scena.addEventListener('pointermove', e => {
    if (!vuci) return;
    const dx = e.clientX - vuci.x0;
    vuci.hod = Math.max(vuci.hod, Math.abs(dx));
    const sirovo = (vuci.smjer === 'dalje' ? -dx : dx) / (vuci.s * 0.62);
    const t = Math.max(0, Math.min(1, sirovo));
    const sada = performance.now();
    vuci.brzina = (t - (okret ? okret.t : 0)) / Math.max(0.001, (sada - vuci.kada) / 1000);
    vuci.kada = sada;
    if (okret) {
      okret.t = t;
      primijeni(t);
    }
  });

  function pustiVucenje() {
    if (!vuci) return;
    const v = vuci;
    vuci = null;
    if (!okret) return;
    if (v.hod < 6) {
      potvrdi();
      return;
    }
    if (okret.t > 0.42 || v.brzina > 1.1) potvrdi();
    else odustani();
  }

  scena.addEventListener('dragstart', e => e.preventDefault());
  scena.addEventListener('selectstart', e => e.preventDefault());
  scena.addEventListener('pointerup', pustiVucenje);
  scena.addEventListener('pointercancel', pustiVucenje);

  function zapocni(smjer, t) {
    opruga = null;
    if (okret) {
      idx = okret.na;
      okret = null;
    }
    gurniLupu(smjer);
    const od = idx;
    okret = {
      smjer: smjer,
      od: od,
      na: smjer === 'dalje' ? (od + 1) % BROJ : (od - 1 + BROJ) % BROJ,
      t: t || 0
    };
    iscrtaj();
  }

  function potvrdi() {
    if (!okret) return;
    if (smireno) {
      idx = okret.na;
      okret = null;
      iscrtaj();
      return;
    }
    idiNa(1, () => {
      idx = okret.na;
      okret = null;
      iscrtaj();
    }, 170, 26);
  }

  function odustani() {
    if (!okret) return;
    idiNa(0, () => {
      okret = null;
      iscrtaj();
    }, 150, 24);
  }

  function korakStrane(smjer) {
    if (uvodRadi) zavrsiUvod();
    if (okret) {
      idx = okret.na;
      okret = null;
    }
    zapocni(smjer, 0);
    potvrdi();
  }

  function idiNaStranu(i) {
    if (uvodRadi) zavrsiUvod();
    if (i === idx) return;
    if (okret) {
      idx = okret.na;
      okret = null;
    }
    const naprijed = (i - idx + BROJ) % BROJ;
    const nazad = (idx - i + BROJ) % BROJ;
    if (Math.min(naprijed, nazad) === 1) {
      korakStrane(naprijed === 1 ? 'dalje' : 'nazad');
      return;
    }
    idx = i;
    iscrtaj();
  }

  document.getElementById('blok-lijevo').onclick = () => korakStrane('nazad');
  document.getElementById('blok-desno').onclick = () => korakStrane('dalje');

  addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const c = e.target;
    if (c && (c.tagName === 'INPUT' || c.tagName === 'TEXTAREA' || c.isContentEditable)) return;
    const m = okvir3d.getBoundingClientRect();
    if (m.bottom < 80 || m.top > innerHeight - 80) return;
    e.preventDefault();
    sakrijSavjet();
    korakStrane(e.key === 'ArrowRight' ? 'dalje' : 'nazad');
  });

  const lupa = document.getElementById('blok-lupa');
  const brojZuma = document.getElementById('blok-broj');
  const tipkaLupe = document.getElementById('blok-lupa-tipka');
  const tipkaVise = document.getElementById('blok-vise');
  const tipkaManje = document.getElementById('blok-manje');
  const slojZuma = document.getElementById('blok-zum');
  const unutraZuma = document.getElementById('blok-zum-unutra');
  const UVECANJE = 2.3;

  let lupaGori = true;
  let lx = null;
  let ly = null;
  let drzi = null;
  let lupaCilj = null;

  function precnikLupe() {
    return Math.round(Math.max(165, Math.min(262, knjiga.clientWidth * 0.235)));
  }

  function kutija() {
    return { x: 0, y: 0, s: knjiga.clientWidth, v: knjiga.clientHeight };
  }

  function spustiLupu() {
    const b = kutija();
    lx = b.x + b.s * 0.88;
    ly = b.y + b.v * 0.855;
    postaviLupu();
  }

  function preslikajZum() {
    unutraZuma.textContent = '';
    for (const c of knjiga.children) {
      if (c.classList.contains('blok-zona')) continue;
      unutraZuma.appendChild(c.cloneNode(true));
    }
  }

  function postaviLupu() {
    if (lx === null) return;
    const B = kutija();
    const bs = B.s;
    const bv = B.v;
    if (!bs) return;

    const R = precnikLupe() / 2;
    const obod = R * 2 * 0.058;
    lupa.style.setProperty('--precnik', R * 2 + 'px');
    lupa.style.transform = 'translate3d(' + (lx - R).toFixed(1) + 'px,' + (ly - R).toFixed(1) + 'px,0)';
    if (lupaGori) lupa.classList.add('gori');

    const z = vid.z;
    const cx = bs / 2;
    const cy = bv / 2;
    const x0 = cx + (bs * LIJEVI - cx) * z;
    const x1 = cx + (bs * DESNI - cx) * z;
    const y0 = cy + (bv * GORNJI - cy) * z;
    const y1 = cy + (bv * DONJI - cy) * z;

    const nx = Math.max(x0, Math.min(lx, x1));
    const ny = Math.max(y0, Math.min(ly, y1));
    const unutra = (lx > x0 && lx < x1 && ly > y0 && ly < y1)
      ? Math.min(lx - x0, x1 - lx, ly - y0, y1 - ly)
      : -Math.hypot(lx - nx, ly - ny);
    const k = Math.max(0, Math.min(1, (unutra + R * 0.30) / (R * 0.55)));

    slojZuma.style.opacity = (lupaGori ? k : 0).toFixed(3);
    if (k <= 0.002) return;

    const r = (R - obod).toFixed(1);
    const maska = 'radial-gradient(circle ' + r + 'px at ' + lx.toFixed(1) + 'px ' + ly.toFixed(1) + 'px,'
      + '#000 calc(100% - 1px),transparent 100%)';
    slojZuma.style.webkitMaskImage = maska;
    slojZuma.style.maskImage = maska;

    const px = cx + (lx - cx) / z;
    const py = cy + (ly - cy) / z;
    const s = UVECANJE * z;
    unutraZuma.style.transform = 'translate(' + (lx - px * s).toFixed(1) + 'px,' + (ly - py * s).toFixed(1) + 'px) '
      + 'scale(' + s.toFixed(4) + ')';
  }

  function gurniLupu(smjer) {
    if (!lupaGori || lx === null || drzi) return;
    const b = kutija();
    const nx = (b.s / 2 + (lx - b.x - b.s / 2) / vid.z) / b.s;
    const ny = (b.v / 2 + (ly - b.y - b.v / 2) / vid.z) / b.v;
    if (nx < 0.02 || nx > 0.98 || ny < 0.17 || ny > 0.83) return;
    lupaCilj = { x: b.x + b.s * (smjer === 'dalje' ? 0.12 : 0.88), y: b.y + b.v * 0.855 };
    gurni();
  }

  function smiriLupu() {
    if (!lupaCilj) return false;
    if (drzi) {
      lupaCilj = null;
      return false;
    }
    const dx = lupaCilj.x - lx;
    const dy = lupaCilj.y - ly;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
      lx = lupaCilj.x;
      ly = lupaCilj.y;
      lupaCilj = null;
      postaviLupu();
      return false;
    }
    lx += dx * 0.17;
    ly += dy * 0.17;
    postaviLupu();
    return true;
  }

  lupa.addEventListener('pointerdown', e => {
    if (!lupaGori || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    lupaCilj = null;
    drzi = { cx: e.clientX, cy: e.clientY, lx0: lx, ly0: ly };
    lupa.classList.add('drzi');
    lupa.setPointerCapture(e.pointerId);
    sakrijSavjet();
  });

  lupa.addEventListener('pointermove', e => {
    if (!drzi) return;
    const b = kutija();
    const R = precnikLupe() / 2;
    lx = Math.max(b.x - R * 0.7, Math.min(b.x + b.s + R * 0.7, drzi.lx0 + (e.clientX - drzi.cx)));
    ly = Math.max(b.y - R * 0.7, Math.min(b.y + b.v + R * 1.0, drzi.ly0 + (e.clientY - drzi.cy)));
    postaviLupu();
  });

  function pustiLupu() {
    drzi = null;
    lupa.classList.remove('drzi');
  }

  lupa.addEventListener('pointerup', pustiLupu);
  lupa.addEventListener('pointercancel', pustiLupu);

  tipkaLupe.onclick = () => {
    lupaGori = !lupaGori;
    tipkaLupe.setAttribute('aria-pressed', String(lupaGori));
    lupa.classList.toggle('gori', lupaGori);
    if (lupaGori && lx === null) spustiLupu();
    if (!lupaGori) slojZuma.style.opacity = '0';
  };

  addEventListener('resize', () => {
    lx = null;
    spustiLupu();
  });

  function osvjeziZum() {
    brojZuma.textContent = Math.round(vid.cz * 100) + '%';
    tipkaManje.disabled = vid.cz <= ZUM_MANJI + 0.001;
    tipkaVise.disabled = vid.cz >= ZUM_VECI - 0.001;
  }

  tipkaVise.onclick = () => {
    postaviPogled(vid.crx, vid.cry, vid.cz * 1.16);
    sakrijSavjet();
  };

  tipkaManje.onclick = () => {
    postaviPogled(vid.crx, vid.cry, vid.cz / 1.16);
    sakrijSavjet();
  };

  STRANE.forEach((strana, i) => {
    const li = el('li');
    const b = el('button', 'blok-ploca');
    b.type = 'button';
    b.innerHTML = '<span class="broj"></span><span class="ime"></span><span class="gdje"></span>';
    b.querySelector('.broj').textContent = String(i + 1).padStart(2, '0');
    b.querySelector('.ime').textContent = strana.naslov;
    b.querySelector('.gdje').textContent = strana.mjesto;
    b.onclick = () => {
      idiNaStranu(i);
      omot.scrollIntoView({ behavior: smireno ? 'auto' : 'smooth', block: 'center' });
    };
    li.appendChild(b);
    spisak.appendChild(li);
  });

  function oznaci() {
    const sada = okret ? okret.na : idx;
    spisak.querySelectorAll('.blok-ploca').forEach((b, i) => {
      b.setAttribute('aria-current', i === sada ? 'true' : 'false');
    });
  }

  let lepeza = null;
  let lepezaNa = 0;
  let uvodRadi = false;

  function zavrsiUvod() {
    uvodRadi = false;
    omot.classList.remove('uvod', 'jace');
  }

  function korakLepeze() {
    const s = lepeza[lepezaNa];
    omot.classList.toggle('jace', s.zvono > 0.55);
    zapocni('dalje', 0);
    prevuciNa(1, s.trajanje, () => {
      idx = okret.na;
      okret = null;
      lepezaNa++;
      if (uvodRadi && lepezaNa < lepeza.length) {
        iscrtaj();
        korakLepeze();
      } else {
        zavrsiUvod();
        iscrtaj();
      }
    });
  }

  function pocniUvod() {
    const grubo = matchMedia('(max-width: 820px), (pointer: coarse)').matches;
    if (grubo || smireno) {
      idx = DOCEK;
      iscrtaj();
      return;
    }
    const koraka = BROJ + DOCEK;
    lepeza = [];
    for (let r = 0; r < koraka; r++) {
      const zvono = Math.sin(Math.PI * (r / (koraka - 1)));
      lepeza.push({ zvono: zvono, trajanje: 0.26 - 0.19 * zvono });
    }
    lepezaNa = 0;
    uvodRadi = true;
    omot.classList.add('uvod');
    korakLepeze();
  }

  async function pokreni() {
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const adrese = [];
      for (const strana of STRANE) adrese.push(await napraviStranu(strana));
      STRANE.forEach((strana, i) => { strana.url = adrese[i]; });
    } catch (greska) {
      omot.hidden = true;
      if (rezerva) rezerva.hidden = false;
      return;
    }

    iscrtaj();
    primijeniPogled();
    osvjeziZum();
    spustiLupu();

    if (!('IntersectionObserver' in window)) {
      pocniUvod();
      return;
    }

    const oko = new IntersectionObserver((ulazi, obs) => {
      ulazi.forEach(u => {
        if (!u.isIntersecting) return;
        obs.disconnect();
        setTimeout(pocniUvod, 220);
      });
    }, { threshold: 0.25 });

    oko.observe(omot);
  }

  if (document.readyState === 'complete') pokreni();
  else addEventListener('load', pokreni);
})();
