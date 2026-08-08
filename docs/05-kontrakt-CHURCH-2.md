# 05 — Kontrakt CHURCH-2

Wersja: 1 · Data: 2026-08-08 · Autor: architekt · Typ: feature
(nowe zachowanie — nowe testy muszą być czerwone przed implementacją).

**Zatwierdzenie operatora:** zatwierdzony aktem operatora z 2026-08-08
(czat): „zatwierdz" — wydanym w odpowiedzi na `OBJECTION` kodera
o pustym polu zatwierdzenia; wpis uzupełnił architekt, bo dla kodera
ten plik jest tylko do odczytu. Kontrakt jest od tej chwili
niemutowalny.

Decyzje, które ten kontrakt realizuje:
[dokument 03](03-model-glosow-ocen-i-rankingu.md) (model głosów,
bezpieczniki) i [dokument 04](04-decyzja-architektura-zapisu-glosow.md)
(architektura zapisu, cięcie zakresu — zdjęcia poza tym kontraktem).
Registry kontraktów nie istnieje (etap 1), więc komplet pól obowiązuje
w treści tego dokumentu.

## goal

Osoba, która była w parafii, zostawia podpisany pseudonimem głos
z ocenami doświadczenia, a po moderacji jej głos — i uczciwe agregaty
z progiem — widzi każdy odwiedzający profil parafii.

## acceptance

Wszystkie stany obserwowalne; „build" znaczy: statyczny build Astro,
„serwis" znaczy: serwis zapisu z `serwer/` uruchamiany lokalnie
i testowany na bazie w pamięci.

1. `npm run verify` pozostaje bramką i jest zielone; suita obejmuje
   testy modułu głosów i serwisu zapisu; `README.md` wylicza komendy
   bramki oraz komendę uruchomienia serwisu deweloperskiego.
2. Wspólny schemat głosu (Zod) odrzuca: głos bez autora (pseudonim +
   identyfikator konta), bez statusu moderacji, ze statusem spoza
   {pending, approved, rejected}, z oceną spoza zakresu 1–5,
   z wymiarem spoza zamkniętej piątki dokumentu 03 (przyjęcie, muzyka,
   z dziećmi, dostępność, organizacja), z e-mailem w jakimkolwiek polu
   publikowanym; przypadki czerwone istnieją w suicie.
3. Build renderuje wyłącznie głosy `approved` z `src/dane/glosy/**`;
   test dowodzi, że fixture `pending` i `rejected` nie pojawia się
   w wygenerowanym HTML. Dane produkcyjne startują puste — zero głosów
   zmyślonych; sekcja głosów pokazuje wtedy zaproszenie „jeszcze
   żadnego głosu" zamiast pustki.
4. Profil parafii pokazuje głosy w formie z makiety v6: cytat szeryfową
   kursywą, pseudonim autora i miesiąc, ocena jako kropki z ułamkowym
   wypełnieniem ostatniej kropki i liczbą z przecinkiem; agregat ogólny
   i pięciu wymiarów, zawsze z liczbą głosów, renderowany wyłącznie gdy
   istnieje ≥ 1 głos approved; funkcja agregująca ma testy jednostkowe
   (średnie, zaokrąglenia, liczność).
5. Ranking miejski renderuje wyłącznie parafie z ≥ 5 głosami approved;
   parafie poniżej progu są wymienione jako „za mało głosów", nigdy
   z pozycją; gdy żadna parafia nie osiąga progu, sekcja rankingu nie
   renderuje się wcale (fail-closed); remisy dzielą pozycję; testy
   jednostkowe progu, remisów i fail-closed istnieją i były czerwone
   przed implementacją.
6. Zero agregacji po wyznaniu: funkcje agregujące przyjmują głosy
   dokładnie jednej parafii (wymusza to ich typ), a test asercyjny
   dowodzi, że żaden wygenerowany HTML nie zawiera średniej ani liczby
   głosów zbiorczo dla wyznania.
7. Serwis zapisu: rejestracja przyjmuje e-mail i wysyła magic link
   przez interfejs `DostawcaEmail` (w testach mock); głos przyjmowany
   wyłącznie od konta zweryfikowanego kliknięciem linku i mającego
   pseudonim; jeden autor ma najwyżej jeden głos na parafię (ponowny
   zapis nadpisuje własny głos oczekujący); głos przyjęty jest zapisany
   trwale w bazie przed odpowiedzią serwisu (nigdy stratny) — testy
   integracyjne na bazie w pamięci.
8. Moderacja: panel dostępny wyłącznie dla operatora (allowlist
   e-mail); approve eksportuje plik głosu przechodzący schemat do
   katalogu danych (w testach: tymczasowego) i oznacza rekord; reject
   wymaga powodu i niczego nie eksportuje; test dowodzi, że żadna
   ścieżka poza approve nie tworzy pliku w katalogu danych.
9. Usunięcie: żądanie usunięcia konta kasuje konto i głosy z bazy
   serwisu oraz generuje listę plików głosów tego autora do usunięcia
   z repo; test dowodzi, że po usunięciu eksport autora jest pusty.
10. E-mail nigdy nie jest publiczny: test asercyjny dowodzi, że
    wygenerowany HTML i eksportowane pliki głosów nie zawierają
    adresów e-mail.
11. Strony pozostają czytelne bez JavaScriptu; formularz głosu działa
    jako zwykły POST (progressive enhancement); ruch i typografia wg
    tokenów dokumentu 01; ocenę estetyczną („ślicznie") wydaje operator
    przy odbiorze — nie jest mechanizowalna.
12. Zasady moderacji z dokumentu 03 (odrzucane kategorie) są widoczne
    przy formularzu głosu jako opis, językiem opisującym, nie
    oceniającym wyznań; rozstrzyga moderator-człowiek.

## non_goals

- zdjęcia w głosach — osobny kontrakt `CHURCH-3` (dokument 04);
- automatyczna moderacja (filtry, LLM) — moderuje człowiek;
- analityka i metryka północna — osobna decyzja operatora;
- mapa interaktywna; kolejne miasta;
- agregaty, ranking lub porównywanie wyznań — zakaz trwały;
- wybór dostawcy e-mail, domeny, hostingu; wdrożenie produkcyjne
  serwisu zapisu;
- inna baza niż `node:sqlite`; konta inne niż magic link.

## allowed_paths

```
src/**
public/**
tests/**
serwer/**
package.json
package-lock.json
astro.config.*
tsconfig.json
.gitignore
README.md
docs/CURRENT_STATE.md
```

`CONSTITUTION.md`, `PROMPT_*.md`, `docs/01-…` – `docs/05-…` — tylko do
odczytu. `PAMIEC_OPERACYJNA.md` — wyłącznie zgodnie z jej protokołem.

## verification

```bash
npm ci
npm run verify
```

`npm run verify` = lint + `astro check` + testy jednostkowe
i integracyjne + pełny build. Czerwień lub brak = brak dowodu;
deklaracja nie jest dowodem.

## Uwagi wykonawcze

- typ feature: nowe testy czerwone przed implementacją; istniejące
  testy `CHURCH-1` traktuj jak preservation — pełna zieleń przed i po;
- nowe zależności spodziewane: `hono` (dokument 04, z planem
  usunięcia); baza wyłącznie wbudowanym `node:sqlite`; każda zależność
  ponad to wymaga obrony w opisie commita;
- dane testowe jawnie fikcyjne (pseudonimy i treści niemylące się
  z realnymi osobami i wspólnotami); zero realnych e-maili
  w fixture'ach;
- sekrety wyłącznie w zmiennych środowiskowych; przykład konfiguracji
  w `serwer/.env.example` bez wartości produkcyjnych;
- dwa raporty w opisie commita: `behavior_delta` i `hygiene_delta`;
- po zieleni koder aktualizuje `docs/CURRENT_STATE.md` (etap 1 → 2)
  w granicach `allowed_paths`.
