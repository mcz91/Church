# Stan bieżący — Church

Jedyne źródło etapu, ograniczeń i następnego kroku. Inne dokumenty
linkują tutaj zamiast utrzymywać własne kopie.

## Etap

**0 — bootstrap, z gotową specyfikacją.** Repozytorium zawiera
konstytucję, prompty ról, pamięć operacyjną, decyzję architektoniczną
MVP ([`01-decyzja-mvp-znajdz-swoje-miejsce.md`](01-decyzja-mvp-znajdz-swoje-miejsce.md))
i kontrakt [`CHURCH-1`](02-kontrakt-CHURCH-1.md) oczekujący na
zatwierdzenie. Nie ma jeszcze kodu produktu, testów ani bramki CI.

## Ograniczenia

- 2026-08-08 operator zakwalifikował budowę aktem właściciela celu,
  z pominięciem ProductBriefu PM-a; założenia produktowe przyjęte w ich
  miejsce są jawnie oznaczone w dokumencie 01 i wchodzą w życie razem
  z zatwierdzeniem `CHURCH-1`;
- stos technologiczny jest wybrany w dokumencie 01 (Astro + TypeScript
  strict + Zod, wyjście statyczne) i wiąże od zatwierdzenia `CHURCH-1`;
- komendy weryfikacji nie istnieją; `CHURCH-1` ustanawia `npm run verify`
  i wpisuje bramkę do `README.md`;
- registry kontraktów nie istnieje; kontrakt obowiązuje w treści
  dokumentu 02 z kompletem pól z `PROMPT_ARCHITEKT.md`;
- oceny użytkowników są jawnie odłożone (nie odrzucone) — wymagają
  osobnego kontraktu z moderacją; uzasadnienie w dokumencie 01.

## Następny krok

Operator zatwierdza (lub odrzuca) kontrakt `CHURCH-1` i rozstrzyga
`BRAK:` z dokumentu 01 (metryka północna, miasto startowe). Po
zatwierdzeniu koder wykonuje `CHURCH-1` w granicach `allowed_paths`.
