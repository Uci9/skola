# Baza na Railway-u

Sajt je statika, ali admin panel traži bazu. Uz statiku sada ide i mali
server (`server.js`) koji služi strane i drži API za panel. Bez baze sajt
i dalje radi — samo panel javi da baza nije podešena.

## 1. Dodaj Postgres

U Railway projektu: **+ New → Database → Add PostgreSQL**.

Railway sam pravi bazu i promjenljivu `DATABASE_URL` u toj usluzi.

## 2. Poveži bazu sa sajtom

Otvori uslugu sa sajtom → **Variables** → **New Variable** → **Add
Reference** → izaberi Postgres i `DATABASE_URL`.

U istoj tabeli dodaj još jednu:

- `ADMIN_LOZINKA` — lozinka za prvi admin nalog

Po želji i:

- `ADMIN_IME` — e-pošta admina, podrazumijevano `admin@ets-pg.edu.me`

## 3. Pusti deploy

Railway sam pokrene `npm start`. Pri prvom pokretanju server:

- napravi sve tabele
- upiše 100 zaposlenih iz `baza/zaposleni.json`
- napravi admin nalog sa lozinkom iz `ADMIN_LOZINKA`

U logu piše `Napravljen admin nalog: admin@ets-pg.edu.me`.

## 4. Prijavi se

Na `/prijava.html`: ime `Admin` i lozinka koju si upisao u `ADMIN_LOZINKA`.
Ime bez `@` se dopunjuje školskom adresom, pa `Admin` radi isto što i
`admin@ets-pg.edu.me`.

## Šta gdje stoji

| Tabela | Čemu služi |
| --- | --- |
| `profili` | nalozi i uloge, lozinke kao scrypt otisak |
| `nastavnici` | spisak zaposlenih |
| `novosti` | vijesti |
| `kutak` | kutak učenika |
| `poslodavci` | partneri |
| `slike` | slike poslate iz panela, u samoj bazi |
| `postavke` | tajna za potpis sesije |

Lozinke se ne čuvaju u čitljivom obliku i nijedna ne stoji u kodu.
`ADMIN_LOZINKA` važi samo dok admin nalog ne postoji — poslije se mijenja
kroz bazu.

## Pokretanje kod sebe

```bash
npm install
DATABASE_URL="postgresql://korisnik:lozinka@localhost:5432/skola" \
ADMIN_LOZINKA="nesto" npm start
```

pa <http://localhost:3000>.
