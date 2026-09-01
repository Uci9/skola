# Sajt ETŠ „Vaso Aligrudić“

Sajt Elektrotehničke škole „Vaso Aligrudić“ u Podgorici. Obična statika —
jedan HTML, jedan CSS, nema builda ni npm-a.

## Pokretanje

```bash
python3 -m http.server 8080
```

pa <http://localhost:8080>. Duplim klikom na fajl ne valja, slike i CSS idu
preko relativnih putanja.

## Fajlovi

```
index.html          cijela strana
assets/styles.css   stilovi
assets/img/         grb + slika zgrade
```

## Šta još fali

- pravi PDF-ovi za sekciju Dokumenti, za sad su svi linkovi `#`
- provjeriti broj odjeljenja po programu u sekretarijatu, ovi brojevi su lanjski
- obavještenja su ukucana ručno; kad bude admin panel ide iz baze
- mapa u kontaktu — treba ubaciti iframe

Uvodna zavjesa se pušta jednom po sesiji (pamti se u sessionStorage).
Za ponovno gledanje dodaj `?intro=1` na adresu.
