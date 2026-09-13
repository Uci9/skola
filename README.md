# Sajt ETŠ „Vaso Aligrudić“

Sajt Elektrotehničke škole „Vaso Aligrudić“ u Podgorici. Strane su obična
statika, bez builda. Uz njih ide mali server koji ih služi i drži API za
admin panel.

## Pokretanje

```bash
npm install
DATABASE_URL="postgresql://korisnik:lozinka@localhost:5432/skola" \
ADMIN_LOZINKA="nesto" npm start
```

pa <http://localhost:3000>. Bez `DATABASE_URL` sajt i dalje radi, samo
admin panel javi da baza nije podešena. Podešavanje na Railway-u stoji u
`baza/UPUTSTVO.md`.

## Fajlovi

```
index.html            početna
profesori.html        nastavnici i osoblje
kutak-ucenika.html    galerija đačkog života
poslodavci.html       partneri i preduzeća
novosti.html          obavještenja
kalkulator.html       bodovi za upis u I razred
server.js             server: statika, API za panel, prijava, slike
assets/styles.css     stilovi za sve strane
assets/baza.js        razgovor sa API-jem
assets/blok.js        skicen-blok na početnoj (O nama)
assets/mek.js         laptop u kontaktu
assets/paralaks.js    slike koje se slažu na skrol (kutak učenika)
assets/kursor.js      pokazivač koji klizi za mišem (desktop)
assets/ispis.js       tekst koji se ispisuje riječ po riječ
assets/img/           grb + slika zgrade
assets/kadrovi/s/     141 slika za telefon, 720px (4,2 MB)
assets/kadrovi/l/     141 slika za desktop, 1200px (7,5 MB)
```

## Dizajn

Boja u punim blokovima — vinska #5A1A2B, zlatna #C9A66B, krem #F7F2EA i bijela —
umjesto jedne podloge sa akcentom.
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

Sekcija „Gdje smo“ je laptop zakovan pri vrhu ekrana dok se strana pomjera:
poklopac se otvara, ekran malo naraste i sklizne naniže, pa stane — ne
odlijeće sa strane. Na ekranu je Google mapa sa adresom škole; prvi klik je
oživljava, do tada je štit preko nje da ne otme skrol. Ispod ostaje razmak
pa tabela sa podacima.

## Šta još fali

- biografije profesora — na karticama za sada piše „u pripremi“
- fotografije za kutak učenika — stoje prazna mjesta
- spisak preduzeća za praktičnu nastavu — vodi ga organizator praktičnog obrazovanja
- vijesti u novosti.html — dopisuju se ručno

Uvodna zavjesa se pušta jednom po sesiji (sessionStorage). Za ponovno
gledanje dodaj `?intro=1` na adresu.
