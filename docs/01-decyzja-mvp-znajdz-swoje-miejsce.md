# 01 — Decyzja architektoniczna: MVP „Znajdź swoje miejsce"

Data: 2026-08-08 · Autor: architekt · Status: **obowiązuje z chwilą
zatwierdzenia kontraktu [`CHURCH-1`](02-kontrakt-CHURCH-1.md) przez
operatora**. Etap i następny krok: [`CURRENT_STATE.md`](CURRENT_STATE.md).

## Kontekst

Operator (właściciel celu) zakwalifikował budowę aktem z 2026-08-08:
„buduj; ma być ładnie, normalnie, prosto ale ślicznie; apka, która pozwoli
znaleźć swoje miejsce". ProductBrief PM-a nie istnieje — akt operatora
zastępuje kwalifikację PM-owską, ale nie dostarcza segmentu, metryki ani
warunku porażki. Założenia przyjęte w ich miejsce są w tym dokumencie
**jawnie oznaczone jako propozycje** i wchodzą w życie razem
z zatwierdzeniem `CHURCH-1`, nie wcześniej.

## Kwalifikacja

| Zakres | Wynik | Uzasadnienie |
|---|---|---|
| Znajdowanie i profil kościoła z faktami ze źródłem | **zbuduj** (`CHURCH-1`) | rdzeń wartości: „znaleźć swoje miejsce" wymaga wiarygodnych faktów, nie opinii |
| Porównanie 2 parafii + trwały link udostępnienia | **zbuduj** (`CHURCH-1`) | najtańszy nośnik pętli udostępnień; link jest interfejsem produktu |
| Oceny użytkowników (UGC) | **odłóż** | wymagają autorstwa, moderacji przed publikacją i backendu; moderacja jest funkcją pierwszej klasy, więc nie wolno jej „dokleić"; wchodzi jako osobny kontrakt po walidacji odczytu |
| Konta użytkowników, personalizacja | **odłóż** | zero danych osobowych, dopóki żaden kontrakt ich jawnie nie wymaga |
| Mapa interaktywna | **odłóż** | adres + link do map zewnętrznych wystarcza w MVP; własna mapa to koszt bez dowodu potrzeby |
| Ranking wyznań / „lepszość" religii | **odrzuć na stałe** | zakaz doktrynalny; oś taka byłaby `OBJECTION: UNSAFE` |

Konsekwencja odłożenia UGC, mówiona wprost: pierwsza iteracja **nie jest
jeszcze „apką oceniającą"** — jest porównywarką faktów. Zatwierdzenie
`CHURCH-1` oznacza zgodę na tę kolejność; oceny są drugim kontraktem,
nie zapomnianą obietnicą.

## Produkt MVP

Trzy ekrany, zero kont, zero zapisu od użytkownika:

1. **Start** — jedno pytanie („Gdzie szukasz swojego miejsca?"), wybór
   miejscowości, lista parafii jako karty (nazwa, wyznanie, adres,
   2–3 wyróżniki faktograficzne);
2. **Profil parafii** — komplet faktów, każdy z widocznym źródłem i datą
   („wg strony parafii, 2026-08-01"); przycisk „porównaj z…";
3. **Porównanie dwóch parafii** — tabela osi obok siebie, trwały opisowy
   URL, poprawny podgląd udostępnienia (tytuł, opis, obraz).

Osie porównania — zamknięta lista, wyłącznie fakty opisowe, żadna nie
wyraża jakości ani „lepszości":

- godziny mszy / nabożeństw w niedzielę i w tygodniu;
- spowiedź: dostępność poza mszą;
- dostępność: wejście bez schodów, miejsce na wózek, pętla indukcyjna;
- dojazd: parking, przystanki komunikacji;
- muzyka: organy / schola / zespół (opisowo);
- wspólnoty i grupy (lista);
- msze z udziałem dzieci, w innych językach, tłumaczone na PJM;
- transmisja online: tak/nie + link.

Rozszerzenie listy osi wymaga zmiany tego dokumentu, nie edycji danych.

## Architektura

- **Prawda danych.** Parafie żyją jako pliki danych w repozytorium.
  Schemat (Zod) wymusza przy każdym fakcie `source` (typ + URL, gdy
  istnieje) i `date`; rekord bez pochodzenia **nie przechodzi builda**.
  Droga zapisu = pull request, więc każda zmiana faktu ma autora, diff
  i historię — moderacja danych jest recenzją PR, nie osobnym systemem.
- **Tania ścieżka odczytu.** Strony generowane statycznie w całości;
  wirusowy skok ruchu obsługuje CDN, degradacja łagodna (brak backendu =
  brak backendu do przeciążenia). JavaScript u klienta tylko tam, gdzie
  jest niezbędny (wyszukiwarka miejscowości, wybór pary do porównania).
- **Link jako interfejs.** `/parafia/<miasto>/<slug>` oraz
  `/porownaj/<slug-a>-vs-<slug-b>` ze slugami w porządku alfabetycznym —
  istnieje dokładnie jeden kanoniczny URL pary; UI nigdy nie generuje
  odwrotnego. Każda strona ma tytuł, opis i obraz Open Graph.
- **Prywatność domyślnie.** Produkt nie zbiera i nie przechowuje żadnych
  danych osobowych; nie ma czego usuwać.

## Stos

**Astro + TypeScript (strict) + content collections z walidacją Zod,
wyjście w pełni statyczne, CSS własny na design tokens, bez frameworka
UI.** Testy: Vitest (schemat i logika) + `astro check` + build jako
weryfikacja end-to-end. Hosting: dowolny statyczny (decyzja operatora
osobno, nie blokuje kodu).

Nudne, sprawdzone, czytelne dla jednej osoby na jednym posiedzeniu;
każda warstwa broni kosztu: Astro daje statyczny build i kolekcje ze
schematem, Zod mechanizuje pochodzenie faktów, brak backendu likwiduje
całe klasy ryzyk (sekrety, RODO, skalowanie zapisu).

Warianty odrzucone:

- **Next.js / Remix + baza danych** — backend bez potrzeby na etapie
  czystego odczytu; koszt utrzymania i skok złożoności nieobroniony;
- **gotowy CMS (WordPress, headless)** — nie wymusza pochodzenia faktów,
  dokłada panel, konta i powierzchnię ataku;
- **Firebase / supabase** — uzależnienie od dostawcy w produkcie, który
  na razie nie ma ani jednego zapisu od użytkownika;
- **czysty generator bez walidacji (Jekyll/Hugo)** — brak mechanizacji
  „fakt bez źródła nie wchodzi"; reguła zostałaby prozą.

## Język wizualny — „prosto, ale ślicznie"

Kierunek po korektach operatora z 2026-08-08: **poetycka prostota** —
nie krzykliwie i nie sakralnie; piękno ma nieść typografia i światło,
nie ornament ani symbolika.

Tokeny (do wdrożenia jako CSS custom properties, jedno źródło):

- tło `#FBFAF6` (papier), tekst `#252A26` (atrament), akcent `#3E6B5E`
  (przygaszona świerkowa zieleń) z tłem pomocniczym `#EDF2EF`; jeden
  akcent, używany oszczędnie; paleta neutralna wyznaniowo;
- typografia dwugłosowa: nazwy, nagłówki i cytaty głosów — lekki szeryf
  w wadze regularnej, kursywa dla tonu odautorskiego; warstwa UI
  (etykiety, przyciski, tabele) — bezszeryf systemowy/Inter; fonty
  self-hosted — zero CDN-ów zewnętrznych;
- zamiast ciężkich ram: linie włoskowe (hairline) jako podziały,
  jedna biała karta „arkusza" dla profilu i porównania, promień 10 px,
  cień ledwo obecny; wyszukiwarka i przyciski jako pigułki;
- kompozycja skondensowana: wąski łam (~660 px), listy zamiast
  kart-kafli, etykiety drobną kapitalikową antykwą;
- mobile-first; bez ikon ozdobnych i symboliki religijnej w warstwie
  UI — treść religijna pojawia się wyłącznie jako fakt w danych.

Głosy użytkowników mają zaprojektowaną formę: cytat szeryfową kursywą,
autor i data pod spodem, dopisek o moderacji — bez gwiazdek i punktacji,
które wprowadzałyby ranking. Wzorcem jest makieta v3. Estetyka nie jest
w pełni mechanizowalna — ostateczną akceptację „ślicznie" wydaje
operator przy odbiorze wdrożenia, i tak zapisuje to kontrakt.

## Mechanizacja decyzji

- pochodzenie faktów → schemat Zod + test czerwony na fakt bez źródła;
- komendy weryfikacji → `CHURCH-1` ustanawia `npm run verify`
  (lint, `astro check`, testy, build) i wpisuje je do `README.md`;
- kanoniczny URL porównania → test jednostkowy porządku slugów;
- zamknięta lista osi → osie zdefiniowane w typie, nie w danych.

## BRAK — decyzje należące do operatora

1. `BRAK: metryka północna.` Propozycja: **tygodniowa liczba wejść
   z linków udostępnionych** (odbiorca kliknął czyjś link). Pomiar
   wymaga analityki, która jest poza `CHURCH-1` — do osobnej decyzji
   (wybór narzędzia bez danych osobowych).
2. `BRAK: miasto startowe.` Kontrakt wymaga jednego miasta i ≥3 realnych
   parafii ze źródłami publicznymi; jeśli operator nie wskaże miasta,
   wybór należy do kodera i jest zapisany w danych — to jawnie
   delegowana swoboda, nie zgadywanie.
3. `BRAK: domena i hosting.` Nie blokuje kodu; potrzebne przed publikacją.
