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
moodle.html           Moodle škole: dokumenti nastavnika, zbirke, arhiva po godinama, pretraga
saradnja.html         upitnik za firme koje žele učenike na praksi
cet.html              školski čet; sam vodi na kutak učenika, a kutak ga učitava kao cet.html?mali
server.js             server: statika, API za panel, prijava, slike
moodle-kopija.js      kopiranje starog Moodle-a na server sajta
assets/styles.css     stilovi za sve strane
assets/baza.js        razgovor sa API-jem
assets/slanje.js      slanje slike sa strane kutka u admin panel
assets/firma.js       slanje upitnika firme u admin panel
assets/cet.js         čet: poruke, osvježavanje svake 3 sekunde, uređivanje za admina
assets/cet-tipka.js   dugme za čet u donjem desnom uglu početne strane
assets/arhiva.js      Moodle: zbirke, godine → razredi → odjeljenja → predmeti, pretraga
baza/moodle.json      preuzeta struktura starog Moodle-a (kursevi, nastavnici, materijali)
assets/predmeti.js    spisak razreda i predmeta za obrazac u panelu
assets/blok.js        skicen-blok na početnoj (O nama)
assets/jezik.js       prekidač LAT/ЋИР/EN: ćirilicu preslovljava, engleski prevodi po rječniku
assets/dogadjaji.js   predstojeći događaji iz baze na strani Novosti
assets/prevod-en.js   engleski rječnik: srpski tekst → engleski
assets/paralaks.js    slike koje se slažu na skrol (kutak učenika)
assets/img/           grb + slika zgrade
assets/programi/      obrazovni programi svih sedam smjerova (PDF iz starog Moodle-a)
assets/kadrovi/s/     141 slika za telefon, 720px (4,2 MB)
assets/kadrovi/l/     141 slika za desktop, 1200px (7,5 MB)
```

## Dizajn

Boja u punim blokovima — navy #083A4F, teal #407E8C, gold #A58D66, sand #E5E1DD i bijela —
umjesto jedne podloge sa akcentom.
Naslovi Bricolage Grotesque, tekst Instrument Sans. Instrument Serif kurziv
ostaje samo na „od 1946.“ u naslovu početne. Meka zaobljenja, sjenke, fotografija koja se preklapa sa karticom.

Raniji dizajni stoje na granama i vraćaju se komandom ispod:

- `dizajn-klasicni` — mornarsko plava i Georgia
- `dizajn-otpornik` — instrument siva, amber, otpornik u heroju

```bash
git checkout <grana> -- index.html profesori.html kutak-ucenika.html \
  poslodavci.html novosti.html kalkulator.html assets/styles.css
```

## Odakle podaci

Spisak zaposlenih je iz dokumenta „Spisak zaposlenih sa zvanjima“ sa
elektropg.online. Kalkulator računa po istoj formuli kao onaj na starom sajtu.

Arhiva u `baza/moodle.json` je preuzeta sa `elektropg.online/ets`
4. 10. 2026: sve kategorije, 1.671 kurs sa nastavnicima i sadržaj 100 kurseva
koji se otvaraju bez prijave. Materijali se ne kopiraju — veze vode na
originalne fajlove, a kursevi koji traže prijavu otvaraju se u Moodle-u.

Profil zaposlenog (slika, biografija, termin za saradnju, školska e-pošta)
stoji u tabeli `nastavnici`. Nalog čija se e-pošta poklapa sa e-poštom
zaposlenog dobija ulogu nastavnika i u panelu vidi samo „Moj profil“ i
„Dokumenti“. Admin e-poštu upisuje u tabu Nastavnici ili nalog veže za
zaposlenog u tabu Nalozi.

Server arhivu daje na `/moodle/arhiva.json`. Admin u panelu (tab Moodle)
može zaključati bilo koji kurs, cijelo odjeljenje ili razred. Zaključani
kursevi stoje u tabeli `zakljucani_kursevi`: svi vide naziv i katanac, a
sadržaj server šalje samo nastavnicima i adminu. Isto važi za dokumente
koje nastavnici postave kao zaključane.

## Uvodni ekran

Pozadina nije video nego niz od 141 slike izvučene iz snimka prilaza školi.
Skrol bira koju sliku iscrtati na canvas — nema premotavanja ni dekodiranja,
pa se iscrtava u istom trenutku kad se skroluje. Tekst se smjenjuje kroz pet
panela.

Niz se bira po gustini ekrana, ne po širini prozora: sve preko 820 tačaka
(širina puta `devicePixelRatio`) uzima veći niz od 1200px, pa ga dobijaju i
telefoni, jer im je 720px bio razvučen i mutan. Manji niz ostaje za rijetke
ekrane i za `saveData` ili 2G vezu. Slike se učitavaju
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

## Moodle

`moodle.html` je zamjena za stari Moodle na `elektropg.online/ets`. Rubrike
su preslikane odatle: Obavještenja, Dokumenta, Obrazovni programi, Gradivo,
Projekti, Vanredni ispiti i Ostalo. Stari linkovi po sajtu sada vode ovdje,
a rubrika se bira i iz adrese (`moodle.html?rubrika=Dokumenta`).

Strana ima dva pogleda, prekidačem na vrhu i preko adrese: `#ucenici` pokazuje
samo otključane dokumente, a `#nastavnici` sve, i zaključane. Ko nije nastavnik,
na nastavničkom pogledu dobije poziv na prijavu umjesto spiska.

Razred i predmet se u obrascu biraju sa spiska, ne kucaju. Spisak stoji u
`assets/predmeti.js`: `RAZREDI` su četiri razreda, a `PREDMETI` drži predmete
za svaki od njih. Dok je spisak predmeta za neki razred prazan, u obrascu
ostaje „Ostalo — upiši“ i polje za ručni unos.

Ko vidi dokument bira se sa dvije stavke: „Svi“ ili „Samo nastavnici škole“.
Drugo je isto što i zaključavanje.

Dokumenti se postavljaju u panelu, u tabu „Moodle dokumenti“. Zbog toga panel
prima i nalog sa ulogom `nastavnik`, ali njemu je to jedini vidljivi tab —
ostalo vidi samo admin. Ulogu dodjeljuje admin na spisku naloga. Ko postavi
dokument, taj ga mijenja i briše; admin može sve.

Zaključan dokument vide samo nastavnici i admin — ne stoji ni u spisku ni na
adresi `/dokument/:id`. Kad se otključa, vide ga svi, i bez naloga.

Datoteke idu u tabelu `datoteke` kao bajtovi, a podaci o njima u `dokumenti`.
Najviše 18 MB po datoteci: PDF, Word, Excel, PowerPoint, tekst, slika ili zip.

Pretraga radi po nazivu, opisu, predmetu i imenu datoteke. Server je radi kroz
`?q=`, a strana uz to filtrira i dok se kuca, bez kvačica.

## Upitnik za firme

Dugme „Javite se upravi škole“ na strani poslodavaca vodi na `saradnja.html`.
Firma tu upiše sve o sebi: naziv, godinu osnivanja, PIB, sjedište, djelatnost,
kontakt i kakvu saradnju traži. Za slanje ne treba nalog. Upitnik ide u tabelu
`firme`, a u panelu ga pokazuje tab „Firme“, odakle se firma jednim klikom
dodaje među poslodavce ili briše. Sa jedne adrese može da se pošalje jedan
upitnik u minuti.

## Nove poruke u panelu

Kad stigne novi upitnik firme ili nova slika za kutak, u panelu se pored taba
pojavi žuti kružić sa brojem, a gore piše koliko je novih poruka ukupno. Isti
broj stoji i pored linka „Admin“ u meniju sajta. Kad admin otvori tab, poruke
se računaju kao pregledane (kolona `vidjeno`). Panel provjerava nove svakih
30 sekundi.

## Zaglavlje

Isti meni stoji u svim stranama: Početna (obična stavka, samo istaknuta bojom),
Škola, Upis i Učenici (sa strelicom, otvaraju padajući meni), Novosti, Dokumenti, Kontakt, Prijava, e-Dnevnik i
prekidač jezika. Koja je strana otvorena, označava `assets/meni.js`, pa se to
ne piše ručno. Ispod 1180px meni ide iza hamburgera.

Jezik se pamti u pregledaču (`localStorage`, ključ `jezik`: `lat`, `cir` ili
`en`). Ćirilica se ne prevodi rječnikom nego preslovljava slovo po slovo (lj, nj
i dž kao jedno slovo). Adrese, rimski brojevi i imena kao Moodle ostaju latinicom.
Što ne treba dirati, dobija `translate="no"`.

## Zaposleni

Tabovi na strani zaposlenih: Svi, Uprava, Školski odbor, Nastavnici, Asistenti
i Održavanje. U meniju Škola stoji samo „Nastavnici i osoblje“; Uprava i Školski odbor su
tabovi na toj strani. Članove školskog odbora admin upisuje u tabu Nastavnici, sa
grupom „Školski odbor“. Svaka osoba iz baze koje nema na statičnom spisku dobije
karticu sama, pa za nove ljude ne treba dirati HTML.

## Kontakt i smjerovi

„Pošalji poruku“ i školska adresa otvaraju Gmail sa već upisanim primaocem
skola@ets-pg.edu.me. Kartica svakog smjera na početnoj otvara njegov obrazovni
program iz `assets/programi/`.

## Kopija Moodle-a

Stari Moodle je jednom već obrisan, pa se sve što je javno na
`elektropg.online/ets` prepisuje na server sajta. Kopiranje se pokreće u panelu,
u tabu Moodle (kartica „Kopija starog Moodle-a“). Ide u pozadini, po tri fajla
odjednom, i nastavlja samo ako se server restartuje. Za cijeli javni dio treba
oko sat vremena i oko 4,5 GB.

- fajlovi i folderi: svaki fajl postaje dokument u tabeli `dokumenti`
  (`moodle_u` pamti odakle je, `moodle_kurs` iz kog kursa)
- strane: sačuvaju se kao HTML, a slike iz njih idu na `/moodle/fajl/:id`
- veze: zapamti se prava adresa, bez prolaska kroz stari Moodle
- forumi, četovi, zadaci i testovi se ne kopiraju

Sami fajlovi ne idu u Postgres nego na disk, imenovani po sha256 sadržaja, pa
se isti fajl iz više kurseva čuva jednom. Disk se bira ovako: `ARHIVA_DIR`, pa
Railway volume (`RAILWAY_VOLUME_MOUNT_PATH`), pa `arhiva-moodle/` pored servera.
**Na Railway-u servisu sajta treba dodati Volume** (npr. 10 GB, putanja `/data`),
inače se kopija briše sa svakim deployem. Panel na to upozorava.

Kad je stavka kopirana, `/moodle/arhiva.json` umjesto veze ka starom Moodle-u
daje `/dokument/:id`, sa nazivom iz baze. U tabu Dokumenti admin prebacuje
„Iz starog Moodle-a“ i tamo traži, preimenuje, zamjenjuje fajl, zaključava ili
briše. Obrisan dokument nestaje i iz arhive.

Kursevi koji u starom Moodle-u traže prijavu ne mogu se kopirati bez naloga.

## Čet

`cet.html` je jedna soba za sve korisnike. Čitaju je i pišu u nju samo
prijavljeni. Poruke stoje u tabeli `poruke` i brišu se poslije 7 dana.
Poruka može imati 500 znakova, a između dvije poruke iste osobe moraju proći
2 sekunde. Admin klikom na tuđu poruku dobija prozor gdje je briše, utišava
osobu na 1 do 24 sata ili joj zabranjuje pisanje.

Čet stoji u kutku učenika (`kutak-ucenika.html#cet`) i nema ga u meniju, učitan kao
`cet.html?mali`, bez zaglavlja i podnožja. Ko otvori `cet.html` direktno,
prebaci se tamo. Admin u panelu, u tabu Čet, upisuje zabranjene riječi (tabela `cet_rijeci`).
Server ih u novoj poruci zamijeni zvjezdicama. Poređenje ne gleda velika slova,
kvačice ni pismo, pa radi i za ćirilicu, a hvata i riječ koja zabranjenu sadrži.

Na početnoj strani u donjem desnom uglu ostaje dugme koje vodi
u kutak. Žuti kružić na dugmetu broji tuđe poruke koje još nisu viđene.
Šta je viđeno pamti se u pregledaču (`localStorage`, ključ `cet-vidjeno`).

## Ghost

Ko u školskom četu pošalje `/ghost`, poruka se ne šalje nego se u novom tabu
otvori `ghost.html`. To je posebna soba samo za učenike (uloga `korisnik`) i
admina; nastavnici je ne mogu otvoriti. Pri ulasku se bira nadimak od tačno 4
slova (tabela `ghost_nadimci`, nadimak je jedinstven), i drugi učenici vide samo
njega. Poruke stoje u `ghost_poruke` i brišu se posle 12 sati. Filter
zabranjenih riječi ovdje ne važi.

Server ne šalje učenicima ko stoji iza nadimka. Admin klikom na poruku vidi
nalog, može je obrisati, utišati osobu ili joj zabraniti pisanje, isto kao u
običnom četu.

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
