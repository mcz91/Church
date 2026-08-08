# Stan bieżący — Church

Jedyne źródło etapu, ograniczeń i następnego kroku. Inne dokumenty
linkują tutaj zamiast utrzymywać własne kopie.

## Etap

**2 — głosy end-to-end (`CHURCH-2`) wykonane.** Repozytorium zawiera:
statyczną witrynę Astro (start z rankingiem miejskim, profil parafii
z agregatami i głosami, porównanie pary, strona „Twój głos"), dane trzech
realnych parafii Torunia, serwis zapisu w [`serwer/`](../serwer)
(Hono + `node:sqlite`: konta magic link, przyjmowanie głosów, moderacja
z eksportem do `src/dane/glosy/**`, droga usunięcia konta) oraz bramkę
`npm run verify` wyliczoną w [`README.md`](../README.md). Dane głosów
startują puste — publikacja wyłącznie przez moderację i repo.
Kontrakt: [`05-kontrakt-CHURCH-2.md`](05-kontrakt-CHURCH-2.md); decyzje:
[03 — model głosów](03-model-glosow-ocen-i-rankingu.md),
[04 — architektura zapisu](04-decyzja-architektura-zapisu-glosow.md).

## Ograniczenia

- stos: Astro + TypeScript strict + Zod, wyjście statyczne; serwis
  zapisu: Hono na Node ≥ 22 z wbudowanym `node:sqlite`; fonty wyłącznie
  systemowe, zero zasobów z CDN-ów;
- miasto startowe: **Toruń** (delegacja z dokumentu 01, sekcja BRAK);
- publikacja głosu wyłącznie po moderacji: approve eksportuje plik do
  `src/dane/glosy/**`, build renderuje tylko `approved`; ranking od
  pięciu głosów, bez progu sekcja nie istnieje (fail-closed);
- dostawca e-mail nierozstrzygnięty (BRAK w dokumencie 04) — magic link
  działa przez interfejs `DostawcaEmail`, deweloping na konsolę;
- hosting serwisu zapisu i domena nierozstrzygnięte (BRAK w dokumencie
  04); build nie ustawia `site`, obraz Open Graph czeka na domenę (DŁUG
  w `PAMIEC_OPERACYJNA.md`); adres serwisu dla stron statycznych podaje
  `PUBLIC_ZAPIS_URL` (domyślnie localhost);
- kolejność kontraktów z [dokumentu 06](06-decyzja-kwalifikacja-pb002-i-integracja.md):
  `CHURCH-3` — automatyczne pozyskiwanie faktów + pilotaż `PB-002`
  w Gdańsku; `CHURCH-4` — zdjęcia w głosach; Toruń do tego czasu
  pozostaje jedynym miastem (walidacja mechaniki);
- registry kontraktów nie istnieje; kontrakty obowiązują w treści
  dokumentów `docs/02-…`, `docs/05-…`;
- metryka północna zatwierdzona w `PB-002` (tygodniowa liczba
  opublikowanych ocen), liczona z historii gita bez analityki osobowej
  (dokument 06); narzędzie analityki odwiedzin pozostaje `BRAK`;
- ocena estetyczna („ślicznie") należy do operatora przy odbiorze —
  nie jest zmechanizowana.

## Następny krok

Kontrakt [`CHURCH-3`](08-kontrakt-CHURCH-3.md) (automatyzacja faktów +
Gdańsk wg `PB-002`, decyzje w [dokumencie 07](07-decyzja-automatyzacja-faktow-i-wstepnej-moderacji.md))
jest napisany — **czeka na akt zatwierdzenia operatora**; do tego czasu
koder go nie wykonuje. Operator odbiera też estetycznie `CHURCH-1`
i `CHURCH-2` („ślicznie") i rozstrzyga BRAK-i (dostawca e-mail,
hosting/CI, domena, narzędzie analityki).
