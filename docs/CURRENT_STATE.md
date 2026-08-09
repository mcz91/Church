# Stan bieżący — Church

Jedyne źródło etapu, ograniczeń i następnego kroku. Inne dokumenty
linkują tutaj zamiast utrzymywać własne kopie.

## Etap

**5 — zdjęcia w głosach (`CHURCH-5`) wykonane.** Głos może nieść do
trzech zdjęć miejsca (JPEG/PNG do 8 MB, alt wymagany): serwis czyści
metadane (EXIF, geolokalizacja) własnym parserem bez zależności przed
zapisem do magazynu; publikacja wyłącznie drogą approve człowieka —
zdjęcia wchodzą do repo obok pliku głosu pod nazwą pochodną
identyfikatora; moderator może odrzucić same zdjęcia; usunięcie konta
obejmuje magazyn i pliki obrazów w repo; galeria profilu wg makiety v6.
Kontrakt: [`10-kontrakt-CHURCH-5.md`](10-kontrakt-CHURCH-5.md).
Wcześniej: **4 — poszerzenie pokrycia Gdańska (`CHURCH-4`).** Repozytorium
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
- registry kontraktów nie istnieje; kontrakty w treści `docs/02/05/08/09/10`;
- ocena estetyczna („ślicznie") należy do operatora przy odbiorze.

## Następny krok

BRAK-i wdrożeniowe rozstrzygnięte aktem operatora (konfiguracja
darmowa, czat 2026-08-08): e-mail — Brevo (implementacja
`DostawcaBrevo` gotowa), hosting statyki — Cloudflare Pages,
harmonogram odświeżania — GitHub Actions (workflow w repo), serwis
zapisu — maszyna operatora (Oracle Free / tunel), domena — subdomena
platformy (własna domena i `og:image` — nadal otwarte). Kroki
wymagające kont operatora wylicza `README.md`, sekcja „Wdrożenie".
Pozostają: wykonanie tych kroków przez operatora, decyzja o pilotażu
przy pokryciu 43,1% oraz odbiór estetyczny `CHURCH-1`–`CHURCH-5`.
