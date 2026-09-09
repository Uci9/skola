import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const URL_BAZE = '';
export const JAVNI_KLJUC = '';

export const podesena = Boolean(URL_BAZE && JAVNI_KLJUC);
export const baza = podesena ? createClient(URL_BAZE, JAVNI_KLJUC) : null;

export async function trenutniKorisnik() {
  if (!baza) return null;
  const { data } = await baza.auth.getUser();
  return data ? data.user : null;
}

export async function mojProfil() {
  const k = await trenutniKorisnik();
  if (!k) return null;
  const { data } = await baza.from('profili').select('*').eq('id', k.id).maybeSingle();
  return data || { id: k.id, email: k.email, uloga: 'korisnik' };
}

export async function jeAdmin() {
  const p = await mojProfil();
  return Boolean(p && p.uloga === 'admin');
}

export async function odjaviSe() {
  if (baza) await baza.auth.signOut();
}

export function porukaGreske(g) {
  if (!g) return '';
  const t = (g.message || String(g)).toLowerCase();
  if (t.includes('invalid login')) return 'Pogrešna e-pošta ili lozinka.';
  if (t.includes('email not confirmed')) return 'Nalog nije potvrđen. Provjeri e-poštu.';
  if (t.includes('already registered') || t.includes('already been registered')) return 'Nalog sa tom e-poštom već postoji.';
  if (t.includes('password should be at least')) return 'Lozinka mora imati bar 6 znakova.';
  if (t.includes('unable to validate email') || t.includes('invalid email')) return 'E-pošta nije ispravna.';
  if (t.includes('row-level security') || t.includes('permission')) return 'Nemaš dozvolu za ovu radnju.';
  if (t.includes('failed to fetch')) return 'Nema veze sa bazom.';
  return g.message || 'Nešto nije prošlo.';
}

export async function posaljiSliku(fajl) {
  if (!baza) throw new Error('Baza nije podešena.');
  const nastavak = (fajl.name.split('.').pop() || 'jpg').toLowerCase();
  const ime = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + nastavak;
  const { error } = await baza.storage.from('slike').upload(ime, fajl, { cacheControl: '31536000' });
  if (error) throw error;
  return baza.storage.from('slike').getPublicUrl(ime).data.publicUrl;
}
