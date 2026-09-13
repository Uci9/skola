const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const express = require('express');
const { Pool } = require('pg');

const koren = __dirname;
const luka = process.env.PORT || 3000;
const adresaBaze = process.env.DATABASE_URL;

const unutrasnja = adresaBaze
  ? /\.railway\.internal|localhost|127\.0\.0\.1/.test(adresaBaze)
  : false;

const bazen = adresaBaze ? new Pool({
  connectionString: adresaBaze,
  ssl: unutrasnja ? false : { rejectUnauthorized: false }
}) : null;

const TABELE = {
  nastavnici: {
    polja: ['ime', 'zvanje', 'grupa', 'biografija', 'slika', 'redoslijed'],
    red: 'redoslijed asc, ime asc'
  },
  novosti: {
    polja: ['naslov', 'rubrika', 'tekst', 'slika', 'datum'],
    red: 'datum desc nulls last, napravljeno desc'
  },
  kutak: {
    polja: ['naslov', 'kategorija', 'opis', 'slika'],
    red: 'napravljeno desc'
  },
  poslodavci: {
    polja: ['naziv', 'oznaka', 'opis'],
    red: 'napravljeno desc'
  }
};

async function napraviShemu() {
  await bazen.query(`
    create table if not exists profili (
      id uuid primary key default gen_random_uuid(),
      email text unique not null,
      ime text,
      uloga text not null default 'korisnik',
      lozinka text not null,
      napravljeno timestamptz default now()
    );
    create table if not exists nastavnici (
      id uuid primary key default gen_random_uuid(),
      ime text not null,
      zvanje text,
      grupa text not null default 'nastavno',
      biografija text,
      slika text,
      redoslijed int default 0,
      napravljeno timestamptz default now()
    );
    create table if not exists novosti (
      id uuid primary key default gen_random_uuid(),
      naslov text not null,
      rubrika text,
      tekst text,
      slika text,
      datum date default current_date,
      napravljeno timestamptz default now()
    );
    create table if not exists kutak (
      id uuid primary key default gen_random_uuid(),
      naslov text not null,
      kategorija text,
      opis text,
      slika text,
      napravljeno timestamptz default now()
    );
    create table if not exists poslodavci (
      id uuid primary key default gen_random_uuid(),
      naziv text not null,
      oznaka text,
      opis text,
      napravljeno timestamptz default now()
    );
    create table if not exists slike (
      id text primary key,
      vrsta text not null,
      podaci bytea not null,
      napravljeno timestamptz default now()
    );
    create table if not exists postavke (
      kljuc text primary key,
      vrijednost text not null
    );
  `);
}

async function posijZaposlene() {
  const { rows } = await bazen.query('select count(*)::int as broj from nastavnici');
  if (rows[0].broj > 0) return;

  const spisak = JSON.parse(fs.readFileSync(path.join(koren, 'baza', 'zaposleni.json'), 'utf8'));
  for (const o of spisak) {
    await bazen.query(
      'insert into nastavnici (ime, zvanje, grupa, redoslijed) values ($1, $2, $3, $4)',
      [o.ime, o.zvanje, o.grupa, o.redoslijed]
    );
  }
  console.log('Upisano ' + spisak.length + ' zaposlenih.');
}

function zamijesi(lozinka, so) {
  const sol = so || crypto.randomBytes(16).toString('hex');
  const zrno = crypto.scryptSync(lozinka, sol, 64).toString('hex');
  return sol + ':' + zrno;
}

function poklapaSe(lozinka, zapisano) {
  if (!zapisano || !zapisano.includes(':')) return false;
  const sol = zapisano.split(':')[0];
  const a = Buffer.from(zamijesi(lozinka, sol));
  const b = Buffer.from(zapisano);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function tajna() {
  const { rows } = await bazen.query("select vrijednost from postavke where kljuc = 'tajna'");
  if (rows.length) return rows[0].vrijednost;
  const nova = process.env.SESIJA_TAJNA || crypto.randomBytes(32).toString('hex');
  await bazen.query("insert into postavke (kljuc, vrijednost) values ('tajna', $1)", [nova]);
  return nova;
}

async function napraviAdmina() {
  const { rows } = await bazen.query("select count(*)::int as broj from profili where uloga = 'admin'");
  if (rows[0].broj > 0) return;

  const lozinka = process.env.ADMIN_LOZINKA;
  if (!lozinka) {
    console.warn('Nema ADMIN_LOZINKA, admin nalog nije napravljen.');
    return;
  }

  const email = (process.env.ADMIN_IME || 'admin@ets-pg.edu.me').toLowerCase();
  await bazen.query(
    `insert into profili (email, ime, uloga, lozinka) values ($1, $2, 'admin', $3)
     on conflict (email) do update set uloga = 'admin', lozinka = excluded.lozinka`,
    [email, 'Admin', zamijesi(lozinka)]
  );
  console.log('Napravljen admin nalog: ' + email);
}

let KLJUC = null;

function upisiSesiju(odgovor, id) {
  const tijelo = Buffer.from(JSON.stringify({ id, do: Date.now() + 30 * 24 * 3600 * 1000 })).toString('base64url');
  const potpis = crypto.createHmac('sha256', KLJUC).update(tijelo).digest('base64url');
  odgovor.cookie('sesija', tijelo + '.' + potpis, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'produkcija',
    maxAge: 30 * 24 * 3600 * 1000
  });
}

function citajSesiju(zahtjev) {
  const kolacic = zahtjev.cookies && zahtjev.cookies.sesija;
  if (!kolacic || !kolacic.includes('.')) return null;

  const [tijelo, potpis] = kolacic.split('.');
  const ocekivan = crypto.createHmac('sha256', KLJUC).update(tijelo).digest('base64url');
  if (potpis.length !== ocekivan.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(potpis), Buffer.from(ocekivan))) return null;

  try {
    const podaci = JSON.parse(Buffer.from(tijelo, 'base64url').toString());
    if (!podaci.do || podaci.do < Date.now()) return null;
    return podaci.id;
  } catch (g) {
    return null;
  }
}

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '9mb' }));

app.use('/api', (zahtjev, odgovor, dalje) => {
  if (bazen) { dalje(); return; }
  if (zahtjev.path === '/ja') { odgovor.json({ bezBaze: true }); return; }
  odgovor.status(503).json({ greska: 'Baza nije podešena.' });
});

app.use((zahtjev, odgovor, dalje) => {
  const sirovo = zahtjev.headers.cookie || '';
  zahtjev.cookies = {};
  sirovo.split(';').forEach(dio => {
    const razmak = dio.indexOf('=');
    if (razmak < 0) return;
    zahtjev.cookies[dio.slice(0, razmak).trim()] = decodeURIComponent(dio.slice(razmak + 1).trim());
  });
  dalje();
});

async function ko(zahtjev) {
  const id = citajSesiju(zahtjev);
  if (!id) return null;
  const { rows } = await bazen.query('select id, email, ime, uloga, napravljeno from profili where id = $1', [id]);
  return rows[0] || null;
}

async function samoAdmin(zahtjev, odgovor, dalje) {
  const osoba = await ko(zahtjev);
  if (!osoba || osoba.uloga !== 'admin') {
    odgovor.status(403).json({ greska: 'Nemaš dozvolu za ovu radnju.' });
    return;
  }
  zahtjev.osoba = osoba;
  dalje();
}

app.post('/api/prijava', async (zahtjev, odgovor) => {
  const email = String(zahtjev.body.email || '').trim().toLowerCase();
  const lozinka = String(zahtjev.body.lozinka || '');

  const { rows } = await bazen.query('select * from profili where email = $1', [email]);
  if (!rows.length || !poklapaSe(lozinka, rows[0].lozinka)) {
    odgovor.status(401).json({ greska: 'Pogrešna e-pošta ili lozinka.' });
    return;
  }

  upisiSesiju(odgovor, rows[0].id);
  odgovor.json({ id: rows[0].id, email: rows[0].email, ime: rows[0].ime, uloga: rows[0].uloga });
});

app.post('/api/upis', async (zahtjev, odgovor) => {
  const email = String(zahtjev.body.email || '').trim().toLowerCase();
  const lozinka = String(zahtjev.body.lozinka || '');
  const ime = String(zahtjev.body.ime || '').trim();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    odgovor.status(400).json({ greska: 'E-pošta nije ispravna.' });
    return;
  }
  if (lozinka.length < 6) {
    odgovor.status(400).json({ greska: 'Lozinka mora imati bar 6 znakova.' });
    return;
  }

  const { rows } = await bazen.query('select id from profili where email = $1', [email]);
  if (rows.length) {
    odgovor.status(409).json({ greska: 'Nalog sa tom e-poštom već postoji.' });
    return;
  }

  const novi = await bazen.query(
    'insert into profili (email, ime, lozinka) values ($1, $2, $3) returning id, email, ime, uloga',
    [email, ime, zamijesi(lozinka)]
  );

  upisiSesiju(odgovor, novi.rows[0].id);
  odgovor.json(novi.rows[0]);
});

app.post('/api/odjava', (zahtjev, odgovor) => {
  odgovor.clearCookie('sesija');
  odgovor.json({ gotovo: true });
});

app.get('/api/ja', async (zahtjev, odgovor) => {
  odgovor.json(await ko(zahtjev));
});

app.get('/api/profili', samoAdmin, async (zahtjev, odgovor) => {
  const { rows } = await bazen.query(
    'select id, email, ime, uloga, napravljeno from profili order by napravljeno desc'
  );
  odgovor.json(rows);
});

app.post('/api/profili/:id/uloga', samoAdmin, async (zahtjev, odgovor) => {
  const uloga = zahtjev.body.uloga === 'admin' ? 'admin' : 'korisnik';
  if (zahtjev.params.id === zahtjev.osoba.id && uloga !== 'admin') {
    odgovor.status(400).json({ greska: 'Sebi ne možeš skinuti admina.' });
    return;
  }
  await bazen.query('update profili set uloga = $1 where id = $2', [uloga, zahtjev.params.id]);
  odgovor.json({ gotovo: true });
});

function opis(ime) {
  const cfg = TABELE[ime];
  if (!cfg) throw new Error('Nepoznata tabela.');
  return cfg;
}

function vrijednosti(cfg, tijelo) {
  const polja = [];
  const podaci = [];
  cfg.polja.forEach(k => {
    if (!(k in tijelo)) return;
    let v = tijelo[k];
    if (v === '' ) v = null;
    if (k === 'redoslijed') v = v == null ? 0 : Number(v);
    polja.push(k);
    podaci.push(v);
  });
  return { polja, podaci };
}

app.get('/api/:tabela', async (zahtjev, odgovor) => {
  let cfg;
  try { cfg = opis(zahtjev.params.tabela); } catch (g) { odgovor.sendStatus(404); return; }
  const { rows } = await bazen.query('select * from ' + zahtjev.params.tabela + ' order by ' + cfg.red);
  odgovor.json(rows);
});

app.post('/api/:tabela', samoAdmin, async (zahtjev, odgovor) => {
  let cfg;
  try { cfg = opis(zahtjev.params.tabela); } catch (g) { odgovor.sendStatus(404); return; }

  const { polja, podaci } = vrijednosti(cfg, zahtjev.body);
  if (!polja.length) { odgovor.status(400).json({ greska: 'Nema podataka.' }); return; }

  const mjesta = polja.map((_, i) => '$' + (i + 1)).join(', ');
  const { rows } = await bazen.query(
    'insert into ' + zahtjev.params.tabela + ' (' + polja.join(', ') + ') values (' + mjesta + ') returning *',
    podaci
  );
  odgovor.json(rows[0]);
});

app.put('/api/:tabela/:id', samoAdmin, async (zahtjev, odgovor) => {
  let cfg;
  try { cfg = opis(zahtjev.params.tabela); } catch (g) { odgovor.sendStatus(404); return; }

  const { polja, podaci } = vrijednosti(cfg, zahtjev.body);
  if (!polja.length) { odgovor.status(400).json({ greska: 'Nema podataka.' }); return; }

  const postavke = polja.map((k, i) => k + ' = $' + (i + 1)).join(', ');
  const { rows } = await bazen.query(
    'update ' + zahtjev.params.tabela + ' set ' + postavke + ' where id = $' + (polja.length + 1) + ' returning *',
    [...podaci, zahtjev.params.id]
  );
  odgovor.json(rows[0] || null);
});

app.delete('/api/:tabela/:id', samoAdmin, async (zahtjev, odgovor) => {
  try { opis(zahtjev.params.tabela); } catch (g) { odgovor.sendStatus(404); return; }
  await bazen.query('delete from ' + zahtjev.params.tabela + ' where id = $1', [zahtjev.params.id]);
  odgovor.json({ gotovo: true });
});

app.post('/api/slike', samoAdmin, async (zahtjev, odgovor) => {
  const vrsta = String(zahtjev.body.vrsta || '');
  const sadrzaj = String(zahtjev.body.podaci || '');

  if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(vrsta)) {
    odgovor.status(400).json({ greska: 'Dozvoljene su samo slike.' });
    return;
  }

  const bajtovi = Buffer.from(sadrzaj, 'base64');
  if (!bajtovi.length || bajtovi.length > 6 * 1024 * 1024) {
    odgovor.status(400).json({ greska: 'Slika mora biti manja od 6 MB.' });
    return;
  }

  const nastavak = vrsta.split('/')[1].replace('jpeg', 'jpg');
  const ime = Date.now().toString(36) + '-' + crypto.randomBytes(4).toString('hex') + '.' + nastavak;
  await bazen.query('insert into slike (id, vrsta, podaci) values ($1, $2, $3)', [ime, vrsta, bajtovi]);
  odgovor.json({ adresa: '/slike/' + ime });
});

app.get('/slike/:ime', async (zahtjev, odgovor) => {
  if (!bazen) { odgovor.sendStatus(404); return; }
  const { rows } = await bazen.query('select vrsta, podaci from slike where id = $1', [zahtjev.params.ime]);
  if (!rows.length) { odgovor.sendStatus(404); return; }
  odgovor.set('Content-Type', rows[0].vrsta);
  odgovor.set('Cache-Control', 'public, max-age=31536000, immutable');
  odgovor.send(rows[0].podaci);
});

app.use((zahtjev, odgovor, dalje) => {
  if (/^\/(server\.js|package(-lock)?\.json|baza\/|\.)/.test(zahtjev.path)) {
    odgovor.sendStatus(404);
    return;
  }
  dalje();
});

app.use(express.static(koren, {
  index: 'index.html',
  dotfiles: 'ignore',
  setHeaders(odgovor, staza) {
    const saVerzijom = odgovor.req && odgovor.req.query && odgovor.req.query.v;
    if (staza.endsWith('.html') || !saVerzijom) odgovor.set('Cache-Control', 'no-cache');
    else odgovor.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

app.use((greska, zahtjev, odgovor, dalje) => {
  console.error(greska);
  odgovor.status(500).json({ greska: 'Nešto nije prošlo na serveru.' });
});

async function sacekajBazu() {
  for (let pokusaj = 1; pokusaj <= 6; pokusaj++) {
    try {
      await bazen.query('select 1');
      return true;
    } catch (greska) {
      console.warn('Baza se ne javlja (' + pokusaj + '/6): ' + greska.message);
      await new Promise(kraj => setTimeout(kraj, 2000));
    }
  }
  return false;
}

(async function kreni() {
  if (bazen) {
    try {
      if (await sacekajBazu()) {
        await napraviShemu();
        await posijZaposlene();
        await napraviAdmina();
        KLJUC = await tajna();
        console.log('Baza spremna.');
      } else {
        console.error('Baza se nije javila, admin panel neće raditi.');
      }
    } catch (greska) {
      console.error('Baza se nije javila:', greska.message);
    }
  } else {
    console.warn('Nema DATABASE_URL — sajt radi, admin panel ne. Dodaj Postgres u Railway-u.');
  }

  app.listen(luka, () => console.log('Sajt radi na luci ' + luka));
})();
