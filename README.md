# Church

Church to porównywarka kościołów: produkt, który pozwala znaleźć, porównać
i udostępnić informacje o kościołach i wspólnotach — z ambicją wirusowości
opartą na wartości dla użytkownika, nigdy na kpinie czy konflikcie.

Repozytorium jest pod kontrolą Foundry (`mcz91/foundry`). Obowiązuje
[`CONSTITUTION.md`](CONSTITUTION.md).

**Bieżący etap, ograniczenia i następny krok:**
[`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md).

## Bramka repozytorium

Komplet komend weryfikacji — wszystkie muszą być zielone przed
zamknięciem każdej zmiany:

```bash
npm ci
npm run verify
```

`npm run verify` wykonuje kolejno:

1. `npm run lint` — ESLint na plikach TypeScriptu;
2. `npm run check` — `astro check` (typy stron i kolekcji);
3. `npm run test` — testy Vitest: jednostkowe (schematy danych i głosów,
   agregaty, ranking, kanoniczny adres porównania) i integracyjne
   (serwis zapisu na bazie w pamięci, build na danych fikcyjnych);
4. `npm run build` — pełny statyczny build Astro.

Podgląd lokalny: `npm run dev`.

Serwis zapisu głosów (deweloperski): `npm run serwis` — wymaga zmiennych
środowiskowych z [`serwer/.env.example`](serwer/.env.example); magic linki
trafiają na konsolę, dopóki dostawca e-mail nie jest rozstrzygnięty.

Zdjęcia w głosach: formularz głosu przyjmuje do trzech zdjęć (JPEG/PNG,
do 8 MB, tekst alternatywny wymagany) zwykłym POST multipart; metadane
(EXIF, geolokalizacja, dane urządzenia) są usuwane przed zapisem do
magazynu (`serwer/magazyn/`, poza repo); publikacja wyłącznie drogą
approve moderatora — zdjęcia wchodzą wtedy do repo obok pliku głosu,
pod nazwą pochodną identyfikatora, nigdy oryginalną.

Pipeline danych Gdańska (sieć wyłącznie przy generowaniu danych — testy
chodzą na zarchiwizowanych fixture'ach):

1. `npm run dane:pozyskaj` — katalog archidiecezji gdańskiej + strony
   parafii o jednoznacznej strukturze → `src/dane/parafie/gdansk/`,
   lista bazowa i raport wyjątków;
2. `npm run dane:odswiez` — porównuje źródła ze stanem repo; zmiana
   wartości daje diff z nową datą odczytu, brak zmiany nie daje niczego;
3. `npm run dane:pokrycie` — raport pokrycia listy bazowej
   ([`src/dane/raporty/gdansk-pokrycie.md`](src/dane/raporty/gdansk-pokrycie.md));
4. `npm run dane:silniki` — klasyfikacja stron z braków po silniku
   (sygnatury w HTML) do `src/dane/raporty/gdansk-silniki.json`;
5. `npm run dane:kolejka` — kolejka wyjątków ręcznych: podgląd
   deterministycznych kandydatów (bez zapisu); zapis wyłącznie
   z plikiem potwierdzeń człowieka, po weryfikacji każdej godziny
   przeciw treści strony źródłowej
   (`npm run dane:kolejka -- potwierdzenia.json`).

## Wdrożenie (konfiguracja darmowa — akt operatora 2026-08-08)

1. **Statyka — Cloudflare Pages**: połącz repozytorium w panelu
   Cloudflare (Workers & Pages → Create → Pages → Connect to Git);
   build: `npm ci && npm run build`, katalog wyjściowy: `dist`,
   zmienna `PUBLIC_ZAPIS_URL` = publiczny adres serwisu zapisu.
   Witryna działa pod subdomeną `*.pages.dev` (własna domena — osobna
   decyzja; odblokuje też `og:image`).
2. **Odświeżanie danych — GitHub Actions**: workflow
   [`odswiez-dane.yml`](.github/workflows/odswiez-dane.yml) raz dziennie
   uruchamia `dane:odswiez` i otwiera pull request ze zmianami — jego
   recenzja jest moderacją danych.
3. **Serwis zapisu — maszyna z Node ≥ 22** (Oracle Cloud Always Free
   albo własna z Cloudflare Tunnel): sklonuj repo, `npm ci`, uzupełnij
   zmienne z [`serwer/.env.example`](serwer/.env.example)
   (`SEKRET_SESJI`, `MODERATORZY`, `BREVO_API_KEY`, `NADAWCA_EMAIL`,
   `BAZOWY_URL`) i uruchom `npm run serwis` pod nadzorem systemd/pm2.
   Baza i magazyn zdjęć żyją na dysku maszyny — kopia zapasowa = kopia
   plików `serwer/dane.db` i `serwer/magazyn/`.
4. **E-mail — Brevo** (plan darmowy, 300/dzień): załóż konto, zweryfikuj
   adres nadawcy, wygeneruj klucz API i podaj go serwisowi w env —
   bez klucza serwis loguje magic linki na konsolę (tryb deweloperski).

## Najważniejsza zasada produktu

> Każdy fakt o kościele ma źródło, każda ocena ma autora, a wirusowość
> nigdy nie powstaje kosztem prawdy ani godności żadnej wspólnoty.

## Role

Sesje LLM inicjalizują prompty w korzeniu repozytorium:

1. [`PROMPT_PM.md`](PROMPT_PM.md) — product manager: hipotezy, metryki,
   pętla wirusowa, wrażliwość tematu;
2. [`PROMPT_ARCHITEKT.md`](PROMPT_ARCHITEKT.md) — architekt: kwalifikacja
   „czy budować", kontrakty `CHURCH-N`, prostota i prawda danych;
3. [`PROMPT_KODER.md`](PROMPT_KODER.md) — wykonawca: jeden kontrakt,
   minimalny diff, testy, higiena;
4. [`PROMPT_AUDYTOR.md`](PROMPT_AUDYTOR.md) — niezależny audytor: findingi
   z dowodami, zero szumu.

Stan między sesjami ról przenosi
[`PAMIEC_OPERACYJNA.md`](PAMIEC_OPERACYJNA.md).

## Zacznij tutaj

1. [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) — status i granice;
2. [`CONSTITUTION.md`](CONSTITUTION.md) — konstytucja wykonawców;
3. prompt roli, w której działasz.
