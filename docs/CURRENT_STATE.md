# Stan bieżący — Church

Jedyne źródło etapu, ograniczeń i następnego kroku. Inne dokumenty
linkują tutaj zamiast utrzymywać własne kopie.

## Etap

**0 — bootstrap, kontrakt zatwierdzony.** Repozytorium zawiera
konstytucję, prompty ról, pamięć operacyjną, decyzje architektoniczne
([01 — MVP](01-decyzja-mvp-znajdz-swoje-miejsce.md),
[03 — głosy i ranking](03-model-glosow-ocen-i-rankingu.md)) oraz
**zatwierdzony przez operatora kontrakt
[`CHURCH-1`](02-kontrakt-CHURCH-1.md)** (2026-08-08, z korektą: bez
osadzanego kroju ozdobnego). Nie ma jeszcze kodu produktu, testów ani
bramki CI.

## Ograniczenia

- stos wiąże z dokumentu 01: Astro + TypeScript strict + Zod, wyjście
  w pełni statyczne; fonty wyłącznie systemowe;
- komendy weryfikacji nie istnieją; `CHURCH-1` ustanawia
  `npm run verify` i wpisuje bramkę do `README.md`;
- registry kontraktów nie istnieje; kontrakt obowiązuje w treści
  dokumentu 02;
- głosy użytkowników (oceny, ranking, zdjęcia) mają zatwierdzony
  kierunek w dokumencie 03, ale wchodzą dopiero kontraktem `CHURCH-2`
  po wykonaniu `CHURCH-1`;
- miasto startowe niewskazane przez operatora — wybór jawnie
  delegowany na kodera (dokument 01, sekcja BRAK);
- metryka północna nierozstrzygnięta; jej pomiar jest poza `CHURCH-1`.

## Następny krok

Koder wykonuje `CHURCH-1` w granicach `allowed_paths` z dokumentu 02:
nowe testy czerwone przed implementacją, potem zieleń `npm run verify`
i aktualizacja tego pliku (etap 0 → 1).
