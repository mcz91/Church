# Stan bieżący — Church

Jedyne źródło etapu, ograniczeń i następnego kroku. Inne dokumenty
linkują tutaj zamiast utrzymywać własne kopie.

## Etap

**3 — automatyzacja faktów i przygotowanie pilotażu Gdańska
(`CHURCH-3`) wykonane.** Repozytorium zawiera: witrynę dwumiastową
(Toruń — dane ręczne, Gdańsk — dane z pipeline'u) z wyborem miasta bez
JavaScriptu, pipeline pozyskania/odświeżania/pokrycia
(`narzedzia/`, komendy w [`README.md`](../README.md)), listę bazową
Gdańska ze źródłami, zgłaszanie błędów faktów z panelem, regułową
wstępną moderację głosów (automat nigdy nie ustawia `approved`)
i metryki kolejki moderacji. Kontrakt:
[`08-kontrakt-CHURCH-3.md`](08-kontrakt-CHURCH-3.md); decyzje:
[06](06-decyzja-kwalifikacja-pb002-i-integracja.md),
[07](07-decyzja-automatyzacja-faktow-i-wstepnej-moderacji.md);
wymagania: [`PB-002`](briefs/PB-002-oceny-odwiedzajacych-automatyzacja.md).

## Pokrycie Gdańska — wybór ścieżki z akceptacji 4

Pokrycie listy bazowej: **22,4% (13 z 58 pozycji)** — poniżej progu
90%, więc obowiązuje ścieżka **raportu braków z przyczyną źródłową per
pozycja**: [`src/dane/raporty/gdansk-pokrycie.md`](../src/dane/raporty/gdansk-pokrycie.md)
(generat `npm run dane:pokrycie`). Przyczyna dominująca: katalog
archidiecezji nie publikuje godzin mszy, a moduł mszy na stronach
parafii (silnik ISP) jest wypełniany wolnym tekstem — deterministyczny
parser czyta wyłącznie jednoznaczne, zweryfikowane warianty etykiet
(sześć wariantów po dopracowaniu); luźniejsze reguły ryzykowałyby
błędne godziny mszy (dokument 07 zakazuje zgadywania). Pozostałe braki:
~22 strony na innych silnikach (nieparsowalne jednym parserem), reszta
to wolny tekst bez etykiet, porządki wyłącznie wakacyjne albo strony
niedostępne. **Start pilotażu poniżej 90% pozostaje decyzją
operatora**; drogi poszerzenia: kolejne zweryfikowane warianty etykiet,
kolejka wyjątków ręcznych, katalogi innych wyznań.

## Ograniczenia

- miasta z zamkniętej listy: **Toruń** (walidacja mechaniki, dane
  ręczne) i **Gdańsk** (pilotaż PB-002, dane z pipeline'u); profile,
  porównania i ranking działają w obrębie jednego miasta;
- lista bazowa Gdańska obejmuje wyłącznie katalog archidiecezji
  gdańskiej; katalogi innych wyznań nie są włączone do mianownika
  (DŁUG w `PAMIEC_OPERACYJNA.md`), wspólnoty bez publicznego katalogu
  jawnie poza listą (pole `pozaMianownikiem`);
- automat moderacji odrzuca samodzielnie wyłącznie twarde przypadki
  (dane kontaktowe, wulgaryzmy) z powodem i flagą odwołania; frazy
  porównujące wyznania dostają podpowiedź; `approved` ustawia wyłącznie
  człowiek; LLM nie dotyka ścieżki prawdy ani decyzji moderacyjnych;
- publiczny start pilotażu i zegar 8 tygodni czekają na BRAK-i
  operatora: dostawca e-mail, hosting/CI (harmonogram `dane:odswiez`),
  domena, narzędzie analityki; zdjęcia w głosach → `CHURCH-4`;
- stos bez zmian: Astro + TypeScript strict + Zod, statyczny build;
  serwis zapisu Hono + `node:sqlite`; fonty systemowe, zero CDN-ów;
- registry kontraktów nie istnieje; kontrakty obowiązują w treści
  `docs/02-…`, `docs/05-…`, `docs/08-…`;
- ocena estetyczna („ślicznie") należy do operatora przy odbiorze.

## Następny krok

Decyzje operatora: (1) los pilotażu Gdańska przy pokryciu 13,8% —
start mimo progu, zlecenie poszerzenia pokrycia albo wstrzymanie;
(2) odbiór estetyczny `CHURCH-1`–`CHURCH-3`; (3) BRAK-i: dostawca
e-mail, hosting/CI, domena, analityka. Po decyzjach architekt pisze
kontrakt `CHURCH-4` (zdjęcia) lub kontrakt poszerzenia pokrycia.
