# Sajt ETŠ „Vaso Aligrudić“

Sajt Elektrotehničke škole „Vaso Aligrudić“ u Podgorici. Obična statika —
nema builda ni npm-a.

## Pokretanje

```bash
python3 -m http.server 8080
```

pa <http://localhost:8080>. Duplim klikom na fajl ne valja, slike i CSS idu
preko relativnih putanja.

## Fajlovi

```
index.html            početna
profesori.html        nastavnici i osoblje
kutak-ucenika.html    galerija đačkog života
poslodavci.html       partneri i preduzeća
novosti.html          obavještenja
kalkulator.html       bodovi za upis u I razred
assets/styles.css     stilovi za sve strane
assets/img/           grb + slika zgrade
```

## Dizajn

Instrument-siva podloga, blizu-crna i amber. Naslovi Archivo, tekst Source Serif 4,
podaci i oznake IBM Plex Mono — sve preko Google Fonts.

Otpornik u heroju nije ukras: četiri trake su godina osnivanja ispisana
otporničkim kodom (smeđa 1, bijela 9, žuta 4, plava 6).

Stari dizajn — mornarsko plava i Georgia — stoji na grani `dizajn-klasicni`.
Vraća se sa:

```bash
git checkout dizajn-klasicni -- index.html profesori.html kutak-ucenika.html \
  poslodavci.html novosti.html kalkulator.html assets/styles.css
```

## Odakle podaci

Spisak zaposlenih je iz dokumenta „Spisak zaposlenih sa zvanjima“ sa
elektropg.online. Dokumenti i obavještenja vode u Moodle škole na
`elektropg.online/ets`. Kalkulator računa po istoj formuli kao onaj na
starom sajtu.

## Šta još fali

- biografije profesora — na karticama za sada piše „u pripremi“
- fotografije za kutak učenika — stoje prazna mjesta
- spisak preduzeća za praktičnu nastavu — vodi ga organizator praktičnog obrazovanja
- vijesti u novosti.html — dopisuju se ručno
- mapa u kontaktu — treba ubaciti iframe

Uvodna zavjesa se pušta jednom po sesiji (sessionStorage). Za ponovno
gledanje dodaj `?intro=1` na adresu.
