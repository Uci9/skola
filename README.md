# Sajt ETŠ „Vaso Aligrudić“

Statički sajt Javne ustanove Srednja elektrotehnička škola „Vaso Aligrudić“, Podgorica.

## Pokretanje lokalno

Nije potreban build ni instalacija paketa:

```bash
python3 -m http.server 8080
```

Zatim otvoriti <http://localhost:8080>.

## Struktura

```
index.html          jedina strana — sve sekcije su na njoj
assets/styles.css   svi stilovi
```

## Napomene za dalji rad

- **Slike se trenutno učitavaju sa `elektropg.online`** (grb škole i fotografija zgrade).
  Prije puštanja u rad snimiti ih lokalno u `assets/img/` — hero već prvo traži
  `assets/img/skola.jpg`, pa tek onda daljinsku adresu.
- **Sadržaj koji treba zamijeniti stvarnim podacima:** obrazovni programi
  (nazivi, broj odjeljenja, opisi), obavještenja, upisni rokovi i spisak dokumenata.
- Uvodna animacija se prikazuje jednom po sesiji. Za ponovno prikazivanje
  dodati `?intro=1` na adresu.
- Poštuje se sistemsko podešavanje `prefers-reduced-motion`.
