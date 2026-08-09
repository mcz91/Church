# Stan bieżący — Church

Jedyne źródło etapu, ograniczeń i następnego kroku. Inne dokumenty
linkują tutaj zamiast utrzymywać własne kopie.

## Etap

**4 — poszerzenie pokrycia Gdańska (`CHURCH-4`) wykonane.** Repozytorium
zawiera: parsery trzech silników stron parafialnych (ISP + WordPress
i Joomla — dwa najliczniejsze z raportu silników), kolejkę wyjątków
ręcznych z zapisem wyłącznie po potwierdzeniu człowieka i weryfikacją
godzin przeciw treści źródła, rejestr rekordów ręcznych z odciskiem
godzinowym (odświeżanie oznacza je „do przeglądu ręcznego", nigdy nie
nadpisuje) oraz komendy `dane:silniki` i `dane:kolejka` obok
dotychczasowego pipeline'u. Kontrakt:
[`09-kontrakt-CHURCH-4.md`](09-kontrakt-CHURCH-4.md); zasady:
[dokument 07](07-decyzja-automatyzacja-faktow-i-wstepnej-moderacji.md).

## Pokrycie Gdańska — wybór ścieżki z akceptacji 6

Pokrycie listy bazowej: **43,1% (25 z 58 pozycji)** — poniżej celu 60%,
więc obowiązuje ścieżka raportu braków: **wszystkie 33 braki mają
przyczynę sprawdzoną ręcznie 2026-08-08**
([`src/dane/raporty/gdansk-pokrycie.md`](../src/dane/raporty/gdansk-pokrycie.md)):
strony martwe/niedostępne i pozycje bez działającego www (ok. 18),
strony niepublikujące porządku mszy w miejscu osiągalnym
deterministycznie (ogłoszenia/JS, ok. 13), wyłącznie porządek wakacyjny
(1 — do ponownego odczytu po wakacjach). Tych przyczyn kolejka ręczna
nie usuwa w dniu sprawdzenia; realne dalsze kroki to kontakt
z parafiami albo kolejne iteracje po zmianach na stronach.

## Ograniczenia

- miasta z zamkniętej listy: **Toruń** (dane ręczne) i **Gdańsk**
  (pipeline + kolejka ręczna); profile, porównania i ranking w obrębie
  jednego miasta;
- rekordy ręczne: 7 pozycji w rejestrze
  (`src/dane/raporty/gdansk-reczne.json`) ze źródłem „strona parafii
  (odczyt ręczny)" i odciskiem godzinowym; automat nigdy ich nie
  nadpisuje;
- mianownik: wyłącznie katalog archidiecezji gdańskiej; katalogi innych
  wyznań sprawdzone 2026-08-08 — luteranie.pl serwuje wyszukiwarkę-mapę
  bez statycznej listy miejskiej, bg.cerkiew.pl nie odpowiada — DŁUG
  pozostaje (pamięć operacyjna);
- automat moderacji i bezpieczniki bez zmian (dokumenty 03, 07): zero
  agregacji po wyznaniu, ranking per miasto z progiem i fail-closed,
  `approved` ustawia wyłącznie człowiek, LLM poza ścieżką prawdy;
- publiczny start pilotażu czeka na BRAK-i operatora: dostawca e-mail,
  hosting/CI (harmonogram odświeżania), domena, analityka; zdjęcia
  w głosach → `CHURCH-5`;
- registry kontraktów nie istnieje; kontrakty w treści `docs/02/05/08/09`;
- ocena estetyczna („ślicznie") należy do operatora przy odbiorze.

## Następny krok

Kontrakt [`CHURCH-5`](10-kontrakt-CHURCH-5.md) (zdjęcia w głosach:
JPEG/PNG, EXIF usuwany przy przyjęciu bez zależności, publikacja
wyłącznie drogą approve człowieka, galeria wg makiety v6) jest
napisany — **czeka na akt zatwierdzenia operatora**. Pozostają decyzje
operatora: (1) los pilotażu przy pokryciu 43,1% z wyczerpanymi dziś
przyczynami braków — start, kontakt z parafiami o publikację godzin,
albo wstrzymanie; (2) odbiór estetyczny `CHURCH-1`–`CHURCH-4`;
(3) BRAK-i (e-mail, hosting/CI, domena, analityka).
