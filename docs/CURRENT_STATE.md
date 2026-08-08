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
- głosy użytkowników (oceny, ranking, zdjęcia) mają zatwierdzony
  kierunek w dokumencie 03 i czekają na kontrakt `CHURCH-2`;
- metryka północna nierozstrzygnięta; analityka poza `CHURCH-1`;
- domena i hosting nierozstrzygnięte (BRAK w dokumencie 01) — build
  nie ustawia `site`, a obraz Open Graph czeka na domenę (DŁUG
  w `PAMIEC_OPERACYJNA.md`);
- ocena estetyczna („ślicznie") należy do operatora przy odbiorze —
  nie jest zmechanizowana.

## Następny krok

Operator odbiera wdrożenie (ocena „ślicznie" z dokumentu 02, akceptacja 7).
Po odbiorze architekt pisze kontrakt `CHURCH-2` (głosy wg dokumentu 03).
