const path = require('node:path');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const crypto = require('node:crypto');
const { Readable, Transform } = require('node:stream');
const { pipeline } = require('node:stream/promises');

const IZVOR = 'https://elektropg.online/ets/';
const RADNIKA = 3;
const NAJVISE_POKUSAJA = 3;
const NAJMANJE_MJESTA = 300 * 1024 * 1024;

const VRSTE_AKTIVNOSTI = {
  'mod/resource/': 'fajl',
  'mod/folder/': 'folder',
  'mod/url/': 'veza',
  'mod/page/': 'strana'
};

const NASTAVCI = {
  pdf: 'pdf', doc: 'doc', docx: 'doc', odt: 'doc', rtf: 'doc', xls: 'xls', xlsx: 'xls', csv: 'xls', ods: 'xls',
  ppt: 'ppt', pptx: 'ppt', pps: 'ppt', ppsx: 'ppt', odp: 'ppt', zip: 'zip', rar: 'zip', '7z': 'zip',
  txt: 'txt', jpg: 'slika', jpeg: 'slika', png: 'slika', gif: 'slika', webp: 'slika', bmp: 'slika',
  c: 'kod', cpp: 'kod', py: 'kod', java: 'kod', html: 'strana', htm: 'strana'
};

const MIME = {
  pdf: 'application/pdf', doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip', txt: 'text/plain', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif'
};

function vrstaAktivnosti(u) {
  const kljuc = Object.keys(VRSTE_AKTIVNOSTI).find(k => u.startsWith(k));
  return kljuc ? VRSTE_AKTIVNOSTI[kljuc] : null;
}

function nastavak(ime) {
  const m = /\.([a-z0-9]{1,5})$/i.exec(ime || '');
  return m ? m[1].toLowerCase() : '';
}

function bezNastavka(ime) {
  return ime.replace(/\.[a-z0-9]{1,5}$/i, '');
}

function oznaka(ime) {
  return NASTAVCI[nastavak(ime)] || 'fajl';
}

function dekodiraj(t) {
  return t.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
}

function imeIzOdgovora(odgovor, adresa) {
  const glava = odgovor.headers.get('content-disposition') || '';
  const utf = /filename\*=UTF-8''([^;]+)/i.exec(glava);
  if (utf) return decodeURIComponent(utf[1]);
  const obicno = /filename="([^"]+)"/i.exec(glava);
  if (obicno) {
    try { return decodeURIComponent(escape(obicno[1])); } catch (g) { return obicno[1]; }
  }
  const put = new URL(adresa).pathname.split('/').pop();
  try { return decodeURIComponent(put); } catch (g) { return put; }
}

function napraviKopiju({ bazen, arhiva, rubrike }) {
  const fascikla = process.env.ARHIVA_DIR
    || (process.env.RAILWAY_VOLUME_MOUNT_PATH && path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'moodle'))
    || path.join(__dirname, 'arhiva-moodle');
  const trajno = Boolean(process.env.ARHIVA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH);

  const aktivnosti = new Map();

  function popisi(grana, put, korijen) {
    (grana.k || []).forEach(k => {
      (k.s || []).forEach(s => (s.a || []).forEach(a => {
        if (!a.u || aktivnosti.has(a.u)) return;
        const vrsta = vrstaAktivnosti(a.u);
        if (!vrsta) return;
        aktivnosti.set(a.u, { a, kurs: k, put, korijen, vrsta, dio: s.n || null });
      }));
    });
    (grana.p || []).forEach(p => popisi(p, put.concat(p.n), korijen));
  }

  arhiva.zbirke.forEach(z => popisi(z, [z.n], 'zbirka'));
  arhiva.godine.forEach(g => popisi(g, [g.n], 'godina'));

  let radi = false;
  let zaustavi = false;
  let poruka = null;
  let zamjene = null;

  async function napraviTabele() {
    await bazen.query(`
      create table if not exists moodle_kopije (
        u text primary key,
        kurs int,
        vrsta text not null,
        stanje text not null default 'ceka',
        adresa text,
        greska text,
        pokusaja int not null default 0,
        azurirano timestamptz default now()
      );
      alter table if exists datoteke alter column podaci drop not null;
      alter table if exists datoteke add column if not exists putanja text;
      alter table if exists dokumenti add column if not exists moodle_u text;
      alter table if exists dokumenti add column if not exists moodle_kurs int;
      create index if not exists dokumenti_moodle_u on dokumenti (moodle_u);
    `);
  }

  function zastarjelo() {
    zamjene = null;
  }

  async function sveZamjene() {
    if (zamjene) return zamjene;
    const nove = new Map();
    const { rows: kopije } = await bazen.query("select u, vrsta, adresa from moodle_kopije where stanje = 'gotovo'");
    kopije.forEach(k => nove.set(k.u, { vrsta: k.vrsta, adresa: k.adresa, dokumenti: [] }));
    const { rows: dok } = await bazen.query(
      `select id, naslov, ime_datoteke, moodle_u, zakljucan from dokumenti
       where moodle_u is not null order by napravljeno, ime_datoteke`
    );
    dok.forEach(d => {
      const z = nove.get(d.moodle_u);
      if (z) z.dokumenti.push(d);
    });
    zamjene = nove;
    return nove;
  }

  async function prepisiAktivnosti(lista, vidi) {
    const z = await sveZamjene();
    return lista.flatMap(a => {
      const k = a.u && z.get(a.u);
      if (!k) return [a];
      if (k.adresa) return [{ ...a, u: k.adresa }];
      const vidljivi = k.dokumenti.filter(d => vidi || !d.zakljucan);
      if (k.vrsta === 'folder') {
        return vidljivi.map(d => ({ n: d.naslov, v: oznaka(d.ime_datoteke), u: '/dokument/' + d.id }));
      }
      if (!vidljivi.length) return [];
      const d = vidljivi[0];
      return [{ ...a, n: d.naslov, v: NASTAVCI[nastavak(d.ime_datoteke)] || a.v, u: '/dokument/' + d.id }];
    });
  }

  async function slobodno() {
    try {
      const s = await fsp.statfs(fascikla);
      return s.bavail * s.bsize;
    } catch (g) {
      return Infinity;
    }
  }

  async function sacuvaj(odgovor, ime, vrsta) {
    const privremeno = path.join(fascikla, '.u-toku-' + crypto.randomBytes(6).toString('hex'));
    const zrno = crypto.createHash('sha256');
    let velicina = 0;
    const brojac = new Transform({
      transform(dio, kod, dalje) {
        zrno.update(dio);
        velicina += dio.length;
        dalje(null, dio);
      }
    });

    try {
      await pipeline(Readable.fromWeb(odgovor.body), brojac, fs.createWriteStream(privremeno));
    } catch (greska) {
      await fsp.rm(privremeno, { force: true });
      throw greska;
    }

    const id = zrno.digest('hex');
    const konacno = path.join(fascikla, id);
    if (fs.existsSync(konacno)) await fsp.rm(privremeno, { force: true });
    else await fsp.rename(privremeno, konacno);

    await bazen.query(
      `insert into datoteke (id, vrsta, ime, velicina, putanja) values ($1, $2, $3, $4, $5)
       on conflict (id) do nothing`,
      [id, vrsta, ime.slice(0, 180), velicina, id]
    );
    return { id, ime, vrsta, velicina };
  }

  async function preuzmi(adresa) {
    const odgovor = await fetch(adresa, { redirect: 'follow', signal: AbortSignal.timeout(5 * 60 * 1000) });
    if (!odgovor.ok) throw new Error('HTTP ' + odgovor.status);
    if (/\/login\//.test(odgovor.url)) {
      const g = new Error('Traži prijavu u Moodle.');
      g.prijava = true;
      throw g;
    }
    return odgovor;
  }

  async function fajlSaAdrese(adresa) {
    const odgovor = await preuzmi(adresa);
    const ime = imeIzOdgovora(odgovor, odgovor.url);
    let vrsta = (odgovor.headers.get('content-type') || '').split(';')[0].trim();
    if (!vrsta || vrsta === 'application/octet-stream' || vrsta === 'application/force-download') {
      vrsta = MIME[nastavak(ime)] || 'application/octet-stream';
    }
    if (vrsta === 'text/html' && !/pluginfile\.php/.test(odgovor.url)) {
      const html = await odgovor.text();
      if (/id="login"|loginform/.test(html)) {
        const g = new Error('Traži prijavu u Moodle.');
        g.prijava = true;
        throw g;
      }
      const m = /href="([^"]*pluginfile\.php\/[^"]*mod_resource\/content[^"]*)"/.exec(html)
        || /src="([^"]*pluginfile\.php\/[^"]*mod_resource\/content[^"]*)"/.exec(html);
      if (!m) throw new Error('U Moodle-u nema fajla na ovoj adresi.');
      return fajlSaAdrese(dekodiraj(m[1]));
    }
    return sacuvaj(odgovor, ime, vrsta);
  }

  function opisDokumenta(stavka) {
    return stavka.put.concat(stavka.kurs.n, stavka.dio || []).join(' · ');
  }

  function razredIz(put) {
    return put.find(p => /^(I|II|III|IV) razred$/.test(p)) || null;
  }

  function rubrikaZa(stavka) {
    if (stavka.korijen === 'godina') return 'Gradivo';
    return rubrike.includes(stavka.put[0]) ? stavka.put[0] : 'Ostalo';
  }

  async function upisiDokument(stavka, fajl, naslov) {
    await bazen.query(
      `insert into dokumenti
         (naslov, opis, rubrika, predmet, razred, datoteka, ime_datoteke, vrsta, velicina, postavio, moodle_u, moodle_kurs)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Stari Moodle', $10, $11)`,
      [
        naslov.slice(0, 300),
        opisDokumenta(stavka),
        rubrikaZa(stavka),
        stavka.kurs.n,
        razredIz(stavka.put),
        fajl.id,
        fajl.ime.slice(0, 180),
        fajl.vrsta,
        fajl.velicina,
        stavka.a.u,
        stavka.kurs.i
      ]
    );
  }

  async function kopirajFajl(stavka) {
    const fajl = await fajlSaAdrese(IZVOR + stavka.a.u);
    await upisiDokument(stavka, fajl, stavka.a.n || bezNastavka(fajl.ime));
  }

  async function kopirajFolder(stavka) {
    const odgovor = await preuzmi(IZVOR + stavka.a.u);
    const html = await odgovor.text();
    const adrese = [...new Set(
      [...html.matchAll(/href="([^"]*pluginfile\.php\/[^"]*mod_folder\/content[^"]*)"/g)].map(m => dekodiraj(m[1]))
    )];
    for (const adresa of adrese) {
      const fajl = await fajlSaAdrese(adresa);
      await upisiDokument(stavka, fajl, bezNastavka(fajl.ime));
    }
  }

  async function kopirajVezu(stavka) {
    const odgovor = await fetch(IZVOR + stavka.a.u, { redirect: 'manual', signal: AbortSignal.timeout(60000) });
    let adresa = odgovor.headers.get('location');
    if (!adresa || adresa.startsWith(IZVOR)) {
      const html = adresa ? await (await preuzmi(adresa)).text() : await odgovor.text();
      const m = /class="urlworkaround"[^>]*>[\s\S]*?<a href="([^"]+)"/.exec(html);
      if (!m) throw new Error('Veza nije pronađena.');
      adresa = dekodiraj(m[1]);
    }
    if (adresa.startsWith(IZVOR)) throw new Error('Veza vodi nazad u stari Moodle.');
    return adresa;
  }

  async function kopirajStranu(stavka) {
    const odgovor = await preuzmi(IZVOR + stavka.a.u);
    const html = await odgovor.text();
    const pocetak = html.indexOf('<div class="no-overflow">');
    const kraj = html.indexOf('<div class="modified">', pocetak);
    if (pocetak < 0) throw new Error('Strana je prazna.');
    let tijelo = html.slice(pocetak, kraj > 0 ? kraj : undefined);

    const slike = [...new Set([...tijelo.matchAll(/src="([^"]*pluginfile\.php[^"]+)"/g)].map(m => m[1]))];
    for (const izvorna of slike) {
      try {
        const fajl = await fajlSaAdrese(dekodiraj(izvorna));
        tijelo = tijelo.split(izvorna).join('/moodle/fajl/' + fajl.id);
      } catch (g) {}
    }

    const naslov = stavka.a.n || 'Strana';
    const dokument = `<!doctype html><html lang="sr-ME"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${naslov.replace(/</g, '&lt;')}</title>
<style>body{max-width:760px;margin:40px auto;padding:0 20px;font:17px/1.6 system-ui,sans-serif;color:#052A3A}img{max-width:100%;height:auto}</style>
</head><body><h1>${naslov.replace(/</g, '&lt;')}</h1>${tijelo}</body></html>`;

    const bajtovi = Buffer.from(dokument);
    const fajl = await sacuvaj(
      { body: Readable.toWeb(Readable.from([bajtovi])) },
      naslov.replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 120) + '.html',
      'text/html'
    );
    await upisiDokument(stavka, fajl, naslov);
  }

  async function obradi(u) {
    const stavka = aktivnosti.get(u);
    if (!stavka) {
      await bazen.query("update moodle_kopije set stanje = 'nema' where u = $1", [u]);
      return;
    }

    await bazen.query('delete from dokumenti where moodle_u = $1', [u]);

    try {
      let adresa = null;
      if (stavka.vrsta === 'fajl') await kopirajFajl(stavka);
      else if (stavka.vrsta === 'folder') await kopirajFolder(stavka);
      else if (stavka.vrsta === 'strana') await kopirajStranu(stavka);
      else adresa = await kopirajVezu(stavka);

      await bazen.query(
        "update moodle_kopije set stanje = 'gotovo', adresa = $2, greska = null, azurirano = now() where u = $1",
        [u, adresa]
      );
    } catch (greska) {
      await bazen.query('delete from dokumenti where moodle_u = $1', [u]);
      await bazen.query(
        `update moodle_kopije set stanje = $2, greska = $3, pokusaja = pokusaja + 1, azurirano = now() where u = $1`,
        [u, greska.prijava ? 'prijava' : 'greska', String(greska.message || greska).slice(0, 300)]
      );
    }
    zastarjelo();
  }

  async function radnik(red) {
    while (!zaustavi && red.length) {
      if (await slobodno() < NAJMANJE_MJESTA) {
        poruka = 'Na disku je ostalo premalo mjesta. Povećaj volume u Railway-u pa nastavi.';
        zaustavi = true;
        return;
      }
      await obradi(red.shift());
    }
  }

  async function pokreni() {
    if (radi) return;
    radi = true;
    zaustavi = false;
    poruka = null;
    try {
      await fsp.mkdir(fascikla, { recursive: true });
      await bazen.query(
        `insert into moodle_kopije (u, kurs, vrsta)
         select * from unnest($1::text[], $2::int[], $3::text[]) on conflict (u) do nothing`,
        [
          [...aktivnosti.keys()],
          [...aktivnosti.values()].map(s => s.kurs.i),
          [...aktivnosti.values()].map(s => s.vrsta)
        ]
      );
      await bazen.query("insert into postavke (kljuc, vrijednost) values ('moodle_kopija', 'radi') on conflict (kljuc) do update set vrijednost = 'radi'");
      const { rows } = await bazen.query(
        `select u from moodle_kopije
         where stanje = 'ceka' or (stanje = 'greska' and pokusaja < $1)
         order by stanje = 'greska', kurs, u`,
        [NAJVISE_POKUSAJA]
      );
      const red = rows.map(r => r.u);
      await Promise.all(Array.from({ length: RADNIKA }, () => radnik(red)));
      if (!zaustavi) {
        await bazen.query("update postavke set vrijednost = 'gotovo' where kljuc = 'moodle_kopija'");
      }
    } catch (greska) {
      poruka = 'Kopiranje je stalo: ' + greska.message;
      console.error(greska);
    } finally {
      radi = false;
      zastarjelo();
    }
  }

  async function stani() {
    zaustavi = true;
    await bazen.query("update postavke set vrijednost = 'stalo' where kljuc = 'moodle_kopija'");
  }

  async function nastaviAkoJeRadila() {
    await napraviTabele();
    const { rows } = await bazen.query("select vrijednost from postavke where kljuc = 'moodle_kopija'");
    if (rows.length && rows[0].vrijednost === 'radi') pokreni();
  }

  async function stanje() {
    const { rows } = await bazen.query('select stanje, count(*)::int as broj from moodle_kopije group by stanje');
    const po = Object.fromEntries(rows.map(r => [r.stanje, r.broj]));
    const { rows: [vel] } = await bazen.query(
      'select coalesce(sum(velicina), 0)::bigint as bajtova, count(*)::int as fajlova from datoteke where putanja is not null'
    );
    const { rows: greske } = await bazen.query(
      "select u, greska from moodle_kopije where stanje in ('greska', 'prijava') order by azurirano desc limit 8"
    );
    const mjesta = await slobodno();
    return {
      radi,
      poruka,
      trajno,
      ukupno: aktivnosti.size,
      gotovo: po.gotovo || 0,
      ceka: po.ceka || 0,
      greska: po.greska || 0,
      prijava: po.prijava || 0,
      bajtova: Number(vel.bajtova),
      fajlova: vel.fajlova,
      slobodno: Number.isFinite(mjesta) ? mjesta : null,
      greske: greske.map(g => ({ ...g, adresa: IZVOR + g.u }))
    };
  }

  function putanjaFajla(ime) {
    return path.join(fascikla, path.basename(ime));
  }

  async function ocisti(id) {
    const { rows } = await bazen.query(
      `delete from datoteke where id = $1 and not exists (select 1 from dokumenti where datoteka = $1)
       returning putanja`,
      [id]
    );
    if (rows.length && rows[0].putanja) await fsp.rm(putanjaFajla(rows[0].putanja), { force: true });
  }

  return {
    fascikla, napraviTabele, nastaviAkoJeRadila, pokreni, stani, stanje,
    prepisiAktivnosti, zastarjelo, putanjaFajla, ocisti
  };
}

module.exports = { napraviKopiju };
