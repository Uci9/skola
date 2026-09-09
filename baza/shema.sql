-- Shema baze za sajt ETŠ „Vaso Aligrudić"
-- Zalijepiti cijeli fajl u Supabase → SQL Editor → New query → Run

create table if not exists nastavnici (
  id uuid primary key default gen_random_uuid(),
  ime text not null,
  zvanje text,
  grupa text not null default 'nastavno',
  biografija text,
  slika text,
  redoslijed int default 0,
  napravljeno timestamptz default now()
);

create table if not exists novosti (
  id uuid primary key default gen_random_uuid(),
  naslov text not null,
  rubrika text,
  tekst text,
  slika text,
  datum date default current_date,
  napravljeno timestamptz default now()
);

create table if not exists kutak (
  id uuid primary key default gen_random_uuid(),
  naslov text not null,
  kategorija text,
  opis text,
  slika text,
  napravljeno timestamptz default now()
);

create table if not exists poslodavci (
  id uuid primary key default gen_random_uuid(),
  naziv text not null,
  oznaka text,
  opis text,
  napravljeno timestamptz default now()
);

create table if not exists profili (
  id uuid primary key references auth.users on delete cascade,
  email text,
  ime text,
  uloga text not null default 'korisnik',
  napravljeno timestamptz default now()
);

create or replace function napravi_profil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profili (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists na_novog_korisnika on auth.users;
create trigger na_novog_korisnika
  after insert on auth.users
  for each row execute function napravi_profil();

create or replace function je_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profili where id = auth.uid() and uloga = 'admin');
$$;

alter table nastavnici enable row level security;
alter table novosti    enable row level security;
alter table kutak      enable row level security;
alter table poslodavci enable row level security;
alter table profili    enable row level security;

do $$
declare t text;
begin
  foreach t in array array['nastavnici','novosti','kutak','poslodavci'] loop
    execute format('drop policy if exists "svi citaju" on %I', t);
    execute format('drop policy if exists "admin pise" on %I', t);
    execute format('create policy "svi citaju" on %I for select using (true)', t);
    execute format('create policy "admin pise" on %I for all using (je_admin()) with check (je_admin())', t);
  end loop;
end $$;

drop policy if exists "svoj profil ili admin" on profili;
create policy "svoj profil ili admin" on profili
  for select using (auth.uid() = id or je_admin());

drop policy if exists "admin mijenja profile" on profili;
create policy "admin mijenja profile" on profili
  for update using (je_admin()) with check (je_admin());

insert into storage.buckets (id, name, public)
values ('slike', 'slike', true)
on conflict (id) do nothing;

drop policy if exists "slike javno citanje" on storage.objects;
create policy "slike javno citanje" on storage.objects
  for select using (bucket_id = 'slike');

drop policy if exists "slike admin upis" on storage.objects;
create policy "slike admin upis" on storage.objects
  for insert with check (bucket_id = 'slike' and je_admin());

drop policy if exists "slike admin brisanje" on storage.objects;
create policy "slike admin brisanje" on storage.objects
  for delete using (bucket_id = 'slike' and je_admin());

delete from nastavnici;
insert into nastavnici (ime, zvanje, grupa, redoslijed) values
  ('Marija Babović', 'v.d. direktora škole', 'uprava', 0),
  ('Semir Ljaljević', 'Pomoćnik direktora škole', 'uprava', 1),
  ('Svetlana Miranović', 'Pomoćnica direktora škole', 'uprava', 2),
  ('Selma Šabotić', 'Pedagogica', 'uprava', 3),
  ('Ivana Rabrenović', 'Psihološkinja', 'uprava', 4),
  ('Maja Ivanović', 'Bibliotekarka', 'uprava', 5),
  ('Milena Nedović Đuričanin', 'Sekretarka', 'uprava', 6),
  ('Azra Pepić', 'Računovotkinja', 'uprava', 7),
  ('Filip Španjević', 'ICT koordinator', 'uprava', 8),
  ('Željka Žarković', 'Organizator praktičnog obrazovanja', 'uprava', 9),
  ('Miloš Ljumović', 'Laborant', 'uprava', 10),
  ('Adilović Alen', 'spec. primijenjenog računarstva', 'nastavno', 0),
  ('Agić Azra', 'spec. elektronike, telekomunikacija i računara', 'nastavno', 1),
  ('Bećirović Emsada', 'dipl. matematičar', 'nastavno', 2),
  ('Bošković Marko', 'spec.energetike i automatike', 'nastavno', 3),
  ('Božović Radovan', 'spec.elektronike, telekomunikacija i računara', 'nastavno', 4),
  ('Brajović Olga', 'spec. primijenjenog računarstva', 'nastavno', 5),
  ('Budrak Aleksandra', 'dipl. ekonomista', 'nastavno', 6),
  ('Bulajić Sandra', 'prof. srpskog jezika i književnosti', 'nastavno', 7),
  ('Bulatović Dijana', 'dipl. matematičar', 'nastavno', 8),
  ('Ćalasan Vesna', 'spec. energetike i automatike', 'nastavno', 9),
  ('Cimbaljević Drago', 'prof. fizičke kulture', 'nastavno', 10),
  ('Čogurić Radmila', 'dipl. ing. elektrotehnike', 'nastavno', 11),
  ('Đaković Dragan', 'prof. istorije i geografije', 'nastavno', 12),
  ('Đaković Persa', 'dipl. ing. elektrotehnike', 'nastavno', 13),
  ('Danilović Milika', 'spec. primjenjenog računarstva', 'nastavno', 14),
  ('Dašić Nada', 'dipl. ing. elektrotehnike', 'nastavno', 15),
  ('Delić Ana', 'MA engleskog jezika i književnosti', 'nastavno', 16),
  ('Đerić Bogdan', 'prof. fizičke kulture', 'nastavno', 17),
  ('Gardašević Nada', 'spec. energetike i automatike', 'nastavno', 18),
  ('Ivanović Olivera', 'dipl. fizičar', 'nastavno', 19),
  ('Jelena Babić', 'spec. primijenjenog računarstva', 'nastavno', 20),
  ('Joldić Jovana', 'dipl.prof. fizičkog vaspitanja i sporta', 'nastavno', 21),
  ('Jovanović Jelena', 'prof. sociologije', 'nastavno', 22),
  ('Knežević Svetlana', 'dipl. matematičar', 'nastavno', 23),
  ('Kočović Mitra', 'spec.energetike i automatike', 'nastavno', 24),
  ('Kojović Nikola', 'spec.elektronike, telekomunikacija i računara', 'nastavno', 25),
  ('Krgušić Žana', 'prof. srpskohrvatskog jezika i južnoslovenske književnosti', 'nastavno', 26),
  ('Krunić Snežana', 'spec. primjenjenog računarstva', 'nastavno', 27),
  ('Lazarević Lidija', 'prof. engleskog jezika i književnosti', 'nastavno', 28),
  ('Leposavić Bogdan', 'dipl. ing. elektrotehnike', 'nastavno', 29),
  ('Lopičić Predrag', 'dipl. ing. elektrotehnike', 'nastavno', 30),
  ('Lučić Mileva', 'dipl. ing. elektrotehnike', 'nastavno', 31),
  ('Mandić Olivera', 'dipl. fizičar', 'nastavno', 32),
  ('Maraš Dejan', 'prof. srpskohrvatskog jezika i knjiž. jug. naroda i narodnosti', 'nastavno', 33),
  ('Marković Ana', 'prof. engleskog jezika i književnosti', 'nastavno', 34),
  ('Markuš Danka', 'spec. primijenjenog računarstva', 'nastavno', 35),
  ('Marušić Vukica', 'prof. sociologije', 'nastavno', 36),
  ('Matović Dubravka', 'dipl. ing. elektrotehnike', 'nastavno', 37),
  ('Milentijević Dragica', 'dipl. ing. elektrotehnike', 'nastavno', 38),
  ('Miloš Sara', 'spec. engleskog jezika i književnosti', 'nastavno', 39),
  ('Nikolić Natalija', 'dipl. ing. elektrotehnike', 'nastavno', 40),
  ('Obradović Jelena', 'MA prof. engleskog jezika i književnosti', 'nastavno', 41),
  ('Pavićević Nikola', 'spec. računarskih nauka', 'nastavno', 42),
  ('Peković Milijana', 'dipl. ing. elektrotehnike', 'nastavno', 43),
  ('Popović Mirjana', 'prof. sociologije', 'nastavno', 44),
  ('Radonjić Marina', 'spec. primijenjenog računarstva', 'nastavno', 45),
  ('Radulović Zoran', 'dipl. ing. elektrotehnike', 'nastavno', 46),
  ('Radusinović Sanja', 'prof. engleskog jezika i književnosti', 'nastavno', 47),
  ('Raičević Nikola', 'spec. primijenjenog računarstva', 'nastavno', 48),
  ('Rašković Violeta', 'dipl. ing. elektrotehnike', 'nastavno', 49),
  ('Rastoder Elida', 'prof. engleskog jezika i književnosti', 'nastavno', 50),
  ('Roganović Nevenka', 'prof. srpskog jezika i književnosti', 'nastavno', 51),
  ('Samardžić Rada', 'dipl. ing. elektrotehnike', 'nastavno', 52),
  ('Sarić Slađana', 'spec. primijenjenog računarstva', 'nastavno', 53),
  ('Šćekić Jelena', 'spec. matematike i računarskih nauka', 'nastavno', 54),
  ('Šćepanović Suzana', 'BSc matematike i računarskih nauka', 'nastavno', 55),
  ('Selman Šabotić', 'prof. fizičke kulture', 'nastavno', 56),
  ('Španjević Jovana', 'spec. engleskog jezika i književnosti', 'nastavno', 57),
  ('Stanišić Milanka', 'dipl. matematičar', 'nastavno', 58),
  ('Stanišić Radomir', 'dipl. ing. elektrotehnike', 'nastavno', 59),
  ('Stevović Mirjana', 'spec. elektronike, telekomunikacija i računara', 'nastavno', 60),
  ('Stojanović Nataša', 'spec. crnogorskog jezika i južnoslovenske književnosti', 'nastavno', 61),
  ('Šuković Biljana', 'prof. matematike', 'nastavno', 62),
  ('Šupić Maja', 'dipl. ing. elektrotehnike', 'nastavno', 63),
  ('Šuškavčević Bojana', 'spec. energetike i automatike', 'nastavno', 64),
  ('Tadić Slobodan', 'spec. strukovni inženjer elektrotehnike i računarstva', 'nastavno', 65),
  ('Tasić Gordana', 'dipl. ing. elektrotehnike', 'nastavno', 66),
  ('Vemić Nada', 'dipl.ing.elektrotehnike', 'nastavno', 67),
  ('Vladimir Kovač', 'dipl.ing.elektrotehnike', 'nastavno', 68),
  ('Vojinović Nikolija', 'spec. eneretike i automatike', 'nastavno', 69),
  ('Vratnica Mladen', 'dipl. ing. elektrotehnike', 'nastavno', 70),
  ('Zeković Jelena', 'spec. energetike i automatike', 'nastavno', 71),
  ('Žeželj Marija', 'spec. informacionih tehnologija', 'nastavno', 72),
  ('Dragović Milena', 'spec. srpskog jezika i južnoslovenske književnosti', 'asistenti', 0),
  ('Gjokaj Lindita', 'SSS', 'asistenti', 1),
  ('Lakušić Ana', 'SSS', 'asistenti', 2),
  ('Stijepović Irena', 'spec. pedagogije', 'asistenti', 3),
  ('Srdanović Ivica', 'Domar', 'pomocno', 0),
  ('Vujičić Dragoslav', 'Domar-ložač', 'pomocno', 1),
  ('Bošković Jelenka', 'Radnica na održavanju čistoće', 'pomocno', 2),
  ('Ćurćić Ljubinka', 'Radnica na održavanju čistoće', 'pomocno', 3),
  ('Ivanović Mladenka', 'Radnica na održavanju čistoće', 'pomocno', 4),
  ('Jovanović Snežana', 'Radnica na održavanju čistoće', 'pomocno', 5),
  ('Krstajić Svetlana', 'Radnica na održavanju čistoće', 'pomocno', 6),
  ('Ljajčaj Ana', 'Radnica na održavanju čistoće', 'pomocno', 7),
  ('Marković Veselinka', 'Radnica na održavanju čistoće', 'pomocno', 8),
  ('Obradović Radmila', 'Radnica na održavanju čistoće', 'pomocno', 9),
  ('Šćekić Darka', 'Radnica na održavanju čistoće', 'pomocno', 10),
  ('Vlahović Marijana', 'Radnica na održavanju čistoće', 'pomocno', 11);
