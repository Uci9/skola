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
assets/blok.js        skicen-blok na početnoj (O nama)
assets/mek.js         laptop u kontaktu
assets/paralaks.js    slike koje se slažu na skrol (kutak učenika)
assets/traka.js       traka slika koja ubrzava sa skrolom (kutak, desktop)
assets/ispis.js       tekst koji se ispisuje riječ po riječ
assets/img/           grb + slika zgrade
assets/kadrovi/s/     141 slika za telefon, 720px (4,2 MB)
assets/kadrovi/l/     141 slika za desktop, 1200px (7,5 MB)
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

Pozadina nije video nego niz od 141 slike izvučene iz snimka prilaza školi.
Skrol bira koju sliku iscrtati na canvas — nema premotavanja ni dekodiranja,
pa se iscrtava u istom trenutku kad se skroluje. Tekst se smjenjuje kroz pet
panela.

Telefoni uzimaju manji niz (720px), desktop veći (1200px). Slike se učitavaju
u dva prolaza: prvo svaka šesta, pa ostale, da se nešto vidi odmah.

Ako slike ne stignu, ostaje fotografija zgrade kao pozadina. Uz „smanjeno
kretanje" u sistemu paneli se slažu jedan ispod drugog.

Slike se prave iz videa ovako:

```bash
ffmpeg -i ulaz.mp4 -vf "scale=720:-2"  -q:v 13 assets/kadrovi/s/k%03d.jpg
ffmpeg -i ulaz.mp4 -vf "scale=1200:-2" -q:v 16 assets/kadrovi/l/k%03d.jpg
```

## O nama

Umjesto slike koja se širi, tu sada stoji skicen-blok. Strane se crtaju na
canvas u pregledaču — lijeva strana tekst, desna fotografija — pa se slika
strane koristi kao pozadina pojaseva od kojih je savijeni list sastavljen.
List se prevlači mišem ili prstom, knjiga se naginje ka kursoru, ima zum i
lupu koja se vuče po strani. Na telefonu nema lupe, a tekst tekuće strane
stoji ispod knjige da se može pročitati.

Ako canvas ne prođe, umjesto bloka se pokaže običan tekst (`#blok-rezerva`).

## Kontakt

Sekcija „Gdje smo“ je laptop koji se otvara na skrol — ekran izlazi iz
kućišta dok se strana pomjera. Ispod stoji tabela sa podacima i dugme za
mapu.

## Šta još fali

- biografije profesora — na karticama za sada piše „u pripremi“
- fotografije za kutak učenika — stoje prazna mjesta
- spisak preduzeća za praktičnu nastavu — vodi ga organizator praktičnog obrazovanja
- vijesti u novosti.html — dopisuju se ručno
- slike u traci na kutku su privremene, sa Unsplasha

Uvodna zavjesa se pušta jednom po sesiji (sessionStorage). Za ponovno
gledanje dodaj `?intro=1` na adresu.
