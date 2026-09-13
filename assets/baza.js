let upamcen;
let bezBaze = false;

async function trazi(staza, opcije) {
  const odgovor = await fetch('/api' + staza, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...opcije
  });

  let tijelo = null;
  try { tijelo = await odgovor.json(); } catch (g) { tijelo = null; }

  if (!odgovor.ok) {
    const greska = new Error((tijelo && tijelo.greska) || 'Nešto nije prošlo.');
    greska.stanje = odgovor.status;
    throw greska;
  }

  return tijelo;
}

export async function trenutniKorisnik() {
  if (upamcen !== undefined) return upamcen;
  try {
    const odgovor = await trazi('/ja');
    if (odgovor && odgovor.bezBaze) {
      bezBaze = true;
      upamcen = null;
    } else {
      upamcen = odgovor;
    }
  } catch (g) {
    upamcen = null;
  }
  return upamcen;
}

export async function imaBazu() {
  await trenutniKorisnik();
  return !bezBaze;
}

export async function mojProfil() {
  return trenutniKorisnik();
}

export async function jeAdmin() {
  const p = await trenutniKorisnik();
  return Boolean(p && p.uloga === 'admin');
}

export async function prijaviSe(email, lozinka) {
  upamcen = await trazi('/prijava', { method: 'POST', body: JSON.stringify({ email, lozinka }) });
  return upamcen;
}

export async function napraviNalog(email, lozinka, ime) {
  upamcen = await trazi('/upis', { method: 'POST', body: JSON.stringify({ email, lozinka, ime }) });
  return upamcen;
}

export async function odjaviSe() {
  await trazi('/odjava', { method: 'POST' });
  upamcen = null;
}

export function porukaGreske(g) {
  if (!g) return '';
  const t = (g.message || String(g)).toLowerCase();
  if (t.includes('failed to fetch') || t.includes('networkerror')) return 'Nema veze sa serverom.';
  return g.message || 'Nešto nije prošlo.';
}

export async function spisak(tabela) {
  return trazi('/' + tabela);
}

export async function dodaj(tabela, podaci) {
  return trazi('/' + tabela, { method: 'POST', body: JSON.stringify(podaci) });
}

export async function izmijeni(tabela, id, podaci) {
  return trazi('/' + tabela + '/' + id, { method: 'PUT', body: JSON.stringify(podaci) });
}

export async function obrisi(tabela, id) {
  return trazi('/' + tabela + '/' + id, { method: 'DELETE' });
}

export async function profili() {
  return trazi('/profili');
}

export async function postaviUlogu(id, uloga) {
  return trazi('/profili/' + id + '/uloga', { method: 'POST', body: JSON.stringify({ uloga }) });
}

function uBazu(fajl) {
  return new Promise((kraj, pad) => {
    const citac = new FileReader();
    citac.onload = () => kraj(String(citac.result).split(',')[1]);
    citac.onerror = () => pad(new Error('Slika se nije pročitala.'));
    citac.readAsDataURL(fajl);
  });
}

export async function posaljiSliku(fajl) {
  const podaci = await uBazu(fajl);
  const { adresa } = await trazi('/slike', {
    method: 'POST',
    body: JSON.stringify({ vrsta: fajl.type, podaci })
  });
  return adresa;
}
