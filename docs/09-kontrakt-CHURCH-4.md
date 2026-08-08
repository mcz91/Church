# 09 — Kontrakt CHURCH-4

Wersja: 1 · Data: 2026-08-08 · Autor: architekt · Typ: feature
(nowe zachowanie — nowe testy muszą być czerwone przed implementacją;
suity `CHURCH-1`–`CHURCH-3` to preservation: pełna zieleń przed i po).

**Zatwierdzenie operatora:** _niewypełnione — kontrakt staje się
wykonywalny wyłącznie po jawnym akcie operatora._

Decyzja kierunkowa operatora (czat 2026-08-08, wybór „poszerz
pokrycie"): pokrycie Gdańska rośnie kolejką wyjątków ręcznych
i parserami kolejnych silników; zdjęcia w głosach przesuwają się na
`CHURCH-5` (koryguje kolejność z dokumentów 04 i 06). Zasady
niezmienne: [dokument 07](07-decyzja-automatyzacja-faktow-i-wstepnej-moderacji.md)
— żadnego zgadywania, LLM nie dotyka ścieżki prawdy. Raport braków,
który ten kontrakt domyka:
[`src/dane/raporty/gdansk-pokrycie.md`](../src/dane/raporty/gdansk-pokrycie.md)
(22,4%, 13 z 58).

## goal

Osoba szukająca swojego miejsca w Gdańsku znajduje kartę zdecydowanej
większości parafii z listy bazowej — a każdy fakt, także wpisany
ręcznie, ma źródło, datę odczytu i drogę odświeżenia.

## acceptance

1. `npm run verify` pozostaje bramką i jest zielone; `README.md`
   wylicza nowe komendy.
2. Raport silników: komenda klasyfikuje strony z braków po silniku
   (sygnatury w HTML) i zapisuje rozkład jako plik w repo — decyzja,
   które parsery pisać, wynika z danych, nie z wrażenia.
3. Parsery dla co najmniej dwóch najliczniejszych silników spoza ISP:
   deterministyczne, na zarchiwizowanych fixture'ach z URL-em i datą
   pobrania, czerwone przed implementacją; rekord poniżej progu
   jakości nie wchodzi (przypadek czerwony); zasada z pamięci
   operacyjnej obowiązuje — nowy wariant etykiety tylko ze
   zweryfikowanym fixture'em, nigdy luźniejszy regex.
4. Kolejka wyjątków ręcznych: komenda przechodzi pozycje raportu
   braków; dla każdej pobiera stronę i pokazuje deterministycznie
   wybrane fragmenty-kandydatów (linie z wzorcami godzin i etykiet);
   wartości zapisuje wyłącznie po jawnym potwierdzeniu człowieka —
   test dowodzi, że tryb nieinteraktywny nie tworzy żadnego pliku;
   rekord dostaje źródło (URL strony), datę odczytu i jawne oznaczenie
   odczytu ręcznego w nazwie źródła.
5. Odświeżanie obejmuje rekordy ręczne: zmiana treści strony źródłowej
   od daty odczytu oznacza rekord w raporcie jako „do przeglądu
   ręcznego" (test na fixture'ach); rekord ręczny nigdy nie jest
   nadpisywany automatycznie.
6. Po wykonaniu kontraktu pokrycie listy bazowej Gdańska wynosi
   **≥60%** albo raport braków wskazuje per pozycja przyczynę,
   której kolejka ręczna nie usuwa (strona martwa, brak opublikowanych
   godzin, wyłącznie porządek wakacyjny) — z datą sprawdzenia.
7. Mianownik: jeżeli publiczny katalog wyznania daje jednoznaczną
   listę wspólnot miejskich (sprawdzić co najmniej katalogi
   ewangelicko-augsburski i prawosławny — DŁUG w pamięci), pozycje
   wchodzą do listy bazowej ze źródłem; jeżeli nie — raport dokumentuje
   dlaczego, a DŁUG pozostaje z datą sprawdzenia.
8. Dane pozyskane w tym kontrakcie są realne, kompletne co do źródła
   i daty; zero rekordów bez potwierdzenia w treści strony źródłowej;
   pipeline uruchamiany z odstępami i pojedynczo (pułapka anty-botowa
   w pamięci operacyjnej).
9. Suity `CHURCH-1`–`CHURCH-3` zielone przed i po; bezpieczniki bez
   zmian (zero agregacji po wyznaniu, ranking per miasto, fail-closed).

## non_goals

- LLM w ścieżce prawdy faktów lub decyzjach moderacyjnych — nadal;
- publiczny start pilotażu (BRAK-i operatora: hosting/CI, e-mail,
  domena, analityka);
- zdjęcia w głosach (`CHURCH-5`), odpowiedzi parafii, monetyzacja;
- miasta poza Toruniem i Gdańskiem;
- parser dla każdego silnika z osobna — wyłącznie dwa najliczniejsze;
  reszta idzie kolejką ręczną albo zostaje w raporcie braków.

## allowed_paths

```
src/**
public/**
tests/**
serwer/**
narzedzia/**
package.json
package-lock.json
astro.config.*
tsconfig.json
.gitignore
README.md
docs/CURRENT_STATE.md
```

`CONSTITUTION.md`, `PROMPT_*.md`, `docs/01-…` – `docs/09-…`,
`docs/briefs/**` — tylko do odczytu. `PAMIEC_OPERACYJNA.md` —
wyłącznie zgodnie z jej protokołem.

## verification

```bash
npm ci
npm run verify
```

Czerwień lub brak = brak dowodu; deklaracja nie jest dowodem.

## Uwagi wykonawcze

- kolejka ręczna to praca danych wykonywana w ramach kontraktu: koder
  przechodzi pozycje z żywych stron, weryfikując każdą wartość
  w treści źródła; „przeczytałem i potwierdzam" jest jedyną drogą
  zapisu — kandydaci-fragmenty są pomocą, nie źródłem;
- fragmenty-kandydaci są wybierani deterministycznie (wzorce godzin
  i etykiet), bez modelu językowego;
- żadnych nowych zależności bez obrony w opisie commita;
- dwa raporty w opisie commita: `behavior_delta` i `hygiene_delta`;
- po zieleni koder aktualizuje `docs/CURRENT_STATE.md` (etap 3 → 4)
  w granicach `allowed_paths`.
