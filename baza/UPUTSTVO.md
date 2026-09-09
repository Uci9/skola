# Podešavanje baze

## 1. Napravi projekat

Otvori <https://supabase.com>, napravi nalog i novi projekat.
Zapamti lozinku baze koju sam odabereš — ne treba mi.

Region: uzmi Frankfurt ili Milano, najbliži su.

## 2. Pusti shemu

U projektu: **SQL Editor → New query**. Zalijepi cijeli sadržaj fajla
`shema.sql` iz ovog foldera i pritisni **Run**.

Time se prave tabele, pravila pristupa, mjesto za slike i upisuje se svih
100 zaposlenih iz postojećeg spiska.

## 3. Napravi admin nalog

**Authentication → Users → Add user → Create new user**

- Email: `admin@ets-pg.edu.me`
- Password: lozinka po izboru
- Uključi *Auto Confirm User*

Zatim opet u **SQL Editor** pusti:

```sql
update profili set uloga = 'admin'
where email = 'admin@ets-pg.edu.me';
```

## 4. Pošalji mi dvije stavke

**Settings → API**, pošalji:

- **Project URL** — izgleda kao `https://xxxxxxxx.supabase.co`
- **anon public** ključ — dugačak niz koji počinje sa `eyJ`

Taj ključ je namijenjen da stoji u kodu sajta, zaštićen je pravilima
pristupa iz sheme.

**Ne šalji `service_role` ključ.** On zaobilazi sva pravila i mora ostati
samo kod tebe.
