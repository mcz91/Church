# Stan bieżący — Church

Jedyne źródło etapu, ograniczeń i następnego kroku. Inne dokumenty
linkują tutaj zamiast utrzymywać własne kopie.

## Etap

**1 — MVP „Znajdź swoje miejsce" wykonane (`CHURCH-1`).** Repozytorium
zawiera kod produktu: statyczną witrynę Astro z trzema ekranami (start,
profil parafii, porównanie pary), dane trzech realnych parafii Torunia
— każdy fakt ze źródłem publicznym i datą odczytu — oraz testy
jednostkowe i bramkę `npm run verify` wyliczoną w [`README.md`](../README.md).
Kontrakt: [`02-kontrakt-CHURCH-1.md`](02-kontrakt-CHURCH-1.md); decyzje:
[01 — MVP](01-decyzja-mvp-znajdz-swoje-miejsce.md),
[03 — głosy i ranking](03-model-glosow-ocen-i-rankingu.md).

## Ograniczenia

- stos z dokumentu 01: Astro + TypeScript strict + Zod (z pakietu
  astro), wyjście w pełni statyczne; fonty wyłącznie systemowe, zero
  zasobów z CDN-ów;
- miasto startowe: **Toruń** — wybór jawnie delegowany na kodera
  (dokument 01, sekcja BRAK), zapisany w `src/dane/parafie/`;
- registry kontraktów nie istnieje; kontrakty obowiązują w treści
  dokumentów `docs/02-…`;
- głosy użytkowników: kierunek w dokumencie 03, architektura zapisu
  w [dokumencie 04](04-decyzja-architektura-zapisu-glosow.md), kontrakt
  [`CHURCH-2`](05-kontrakt-CHURCH-2.md) **napisany, niezatwierdzony** —
  do aktu operatora żaden koder go nie wykonuje; zdjęcia wycięte do
  przyszłego `CHURCH-3`;
- metryka północna nierozstrzygnięta; analityka poza `CHURCH-1`;
- domena i hosting nierozstrzygnięte (BRAK w dokumencie 01) — build
  nie ustawia `site`, a obraz Open Graph czeka na domenę (DŁUG
  w `PAMIEC_OPERACYJNA.md`);
- ocena estetyczna („ślicznie") należy do operatora przy odbiorze —
  nie jest zmechanizowana.

## Następny krok

Poprawki z przeglądu architekta są wykonane (commit `92f5c85`).
Dwa akty operatora: (1) odbiór wdrożenia `CHURCH-1` (ocena „ślicznie",
`docs/02` akc. 7), (2) zatwierdzenie kontraktu
[`CHURCH-2`](05-kontrakt-CHURCH-2.md). Po zatwierdzeniu koder wykonuje
`CHURCH-2`. Osobno: rozplątanie równoległej gałęzi PM (pułapka
w `PAMIEC_OPERACYJNA.md`) wymaga decyzji operatora o kolejności
scalania (konstytucja §14).
