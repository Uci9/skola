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
assets/img/         grb škole i fotografija zgrade
```

## Napomene za dalji rad

- Slike (`assets/img/grb.svg`, `assets/img/skola.jpg`) preuzete su sa ranijeg
  sajta škole i sada se nalaze u repozitorijumu — sajt ne zavisi od spoljnih adresa.
- **Sadržaj koji treba zamijeniti stvarnim podacima:** obrazovni programi
  (nazivi, broj odjeljenja, opisi), obavještenja, upisni rokovi i spisak dokumenata.
- Uvodna animacija se prikazuje jednom po sesiji. Za ponovno prikazivanje
  dodati `?intro=1` na adresu.
- Poštuje se sistemsko podešavanje `prefers-reduced-motion`.
