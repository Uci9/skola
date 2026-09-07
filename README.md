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
assets/video/ulaz.mp4 video za uvodni ekran (4,6 MB)
```

## Dizajn

Boja u punim blokovima — kobalt, koral, puter — umjesto jedne podloge sa akcentom.
Naslovi Bricolage Grotesque, po koja riječ u Instrument Serif kurzivu, tekst
Instrument Sans. Meka zaobljenja, sjenke, fotografija koja se preklapa sa karticom.

Raniji dizajni stoje na granama i vraćaju se komandom ispod:

- `dizajn-klasicni` — mornarsko plava i Georgia
- `dizajn-otpornik` — instrument siva, amber, otpornik u heroju

```bash
git checkout <grana> -- index.html profesori.html kutak-ucenika.html \
  poslodavci.html novosti.html kalkulator.html assets/styles.css
```

## Odakle podaci

Spisak zaposlenih je iz dokumenta „Spisak zaposlenih sa zvanjima“ sa
elektropg.online. Dokumenti i obavještenja vode u Moodle škole na
`elektropg.online/ets`. Kalkulator računa po istoj formuli kao onaj na
starom sajtu.

## Uvodni ekran

Video ide preko cijelog ekrana, skrol ga premotava, a tekst se smjenjuje kroz pet
panela. Ako se video ne učita, ostaje fotografija zgrade i tekst se i dalje smjenjuje.
Na telefonima i uz „smanjeno kretanje" u sistemu paneli se slažu jedan ispod drugog,
a video se uopšte ne preuzima.

Video je H.264 (`avc1.640020`), 1376x768, 5,88 s. Ima samo jedan ključni kadar, pa
premotavanje unazad zna da zastane. Ako zatreba glađe, sa `ffmpeg`:

```bash
ffmpeg -i ulaz.mp4 -c:v libx264 -g 1 -crf 24 -movflags +faststart -an ulaz-gladak.mp4
ffmpeg -i ulaz.mp4 -c:v libvpx-vp9 -g 1 -crf 34 -b:v 0 -an ulaz.webm
```

## Šta još fali

- biografije profesora — na karticama za sada piše „u pripremi“
- fotografije za kutak učenika — stoje prazna mjesta
- spisak preduzeća za praktičnu nastavu — vodi ga organizator praktičnog obrazovanja
- vijesti u novosti.html — dopisuju se ručno
- mapa u kontaktu — treba ubaciti iframe

Uvodna zavjesa se pušta jednom po sesiji (sessionStorage). Za ponovno
gledanje dodaj `?intro=1` na adresu.
