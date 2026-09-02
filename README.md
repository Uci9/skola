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
