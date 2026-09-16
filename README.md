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
moodle.html           ulaz u Moodle, posebno za učenike i nastavnike
server.js             server: statika, API za panel, prijava, slike
assets/styles.css     stilovi za sve strane
assets/baza.js        razgovor sa API-jem
assets/slanje.js      slanje slike sa strane kutka u admin panel
assets/blok.js        skicen-blok na početnoj (O nama)
assets/paralaks.js    slike koje se slažu na skrol (kutak učenika)
assets/ispis.js       tekst koji se ispisuje riječ po riječ
assets/img/           grb + slika zgrade
assets/kadrovi/s/     141 slika za telefon, 720px (4,2 MB)
assets/kadrovi/l/     141 slika za desktop, 1200px (7,5 MB)
```

## Dizajn

Boja u punim blokovima — navy #083A4F, teal #407E8C, gold #A58D66, sand #E5E1DD i bijela —
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

Sekcija „Gdje smo“ je tabela sa podacima škole, a pored nje Google mapa sa
adresom.

## Slike od učenika

Na dnu kutka učenika stoji obrazac za slanje slike. Radi samo prijavljenom
korisniku, da se zna ko je poslao — neprijavljenom piše poziv na prijavu.
Slika ne ide e-poštom nego pravo u bazu, u tabelu `prijedlozi`, uz ime
pošiljaoca. U admin panelu ih pokazuje tab „Slike učenika“, odakle se
brišu ili prebacuju u kutak.

## Nalozi

Nalog se pravi samo školskom adresom `@ets-pg.edu.me`. Provjera stoji u
obrascu i na serveru, pa se ne može zaobići. Ime bez `@` se dopunjuje
školskom adresom, pa `pero` radi isto što i `pero@ets-pg.edu.me`.

Prijava traži istu adresu. Jedini izuzetak su admin nalozi — oni rade i sa
drugom adresom, da škola ne ostane bez panela ako je admin upisan preko
`ADMIN_IME`.

## Šta još fali

- biografije profesora — na karticama za sada piše „u pripremi“
- fotografije za kutak učenika — stoje prazna mjesta
- spisak preduzeća za praktičnu nastavu — vodi ga organizator praktičnog obrazovanja
- vijesti u novosti.html — dopisuju se ručno

Uvodna zavjesa se pušta jednom po sesiji (sessionStorage). Za ponovno
gledanje dodaj `?intro=1` na adresu.
