# Stan bieżący — Church

Jedyne źródło etapu, ograniczeń i następnego kroku. Inne dokumenty
linkują tutaj zamiast utrzymywać własne kopie.

## Etap

**6 — zdjęcia-wizytówki budynków (`CHURCH-6`)** to ostatni **kontrakt**
zamknięty w repo. Ponad nim leży jedna zmiana **bez kontraktu**:
wyszukiwanie „msza niedługo" i zawężanie listy startowej (akt operatora
„proceed", czat 2026-08-10, po sprzeciwie kodera, że reszta żądania
wymaga dokumentów architekta). Nie myl jej z `CHURCH-7` — ten numer
należy do niezatwierdzonego kontraktu szlifu
([dokument 13](13-kontrakt-CHURCH-7.md)). Panel nad listą zawęża
parafie po porze najbliższej mszy (30 min / godzina / 2 godziny) i po
cechach wyprowadzonych z faktów (dzieci, młodzież, spowiedź poza mszą).
Godziny wydobywa [`src/lib/msze.ts`](../src/lib/msze.ts) i bierze
wyłącznie pozycje pewne: dopisek sezonowy, inny dzień albo zdanie
negujące unieważniają godzinę, a parafia nie pojawia się w wynikach
zamiast pokazać godzinę zgadniętą. Pokrycie na danych realnych: pewne
godziny niedzielne ma **28 z 28** parafii, tygodniowe **26 z 28**.
Panel jest progresywnym wzbogaceniem — bez JavaScriptu pełna lista
zostaje w dokumencie. **Kolizja do rozstrzygnięcia przy `CHURCH-7`:**
jego akceptacja 3 planuje statyczne strony-filtry `/<miasto>/<filtr>`,
a akceptacja 2 przenosi listę parafii ze startu na strony miast — panel
trzeba będzie wtedy przenieść albo zastąpić.

Etap 6 (akt zatwierdzenia: czat 2026-08-09 „zatwierdz") dał zdjęcia
budynków. Każda parafia może mieć
jedno redakcyjne zdjęcie budynku wyłącznie z Wikimedia Commons:
schemat `zdjecie` (plik, alt, autor, licencja z zamkniętej listy
wolnych, URL strony pliku, data pobrania), kolejka
`npm run dane:wizytowki` z metadanymi z `extmetadata` API i zapisem
tylko po potwierdzeniu człowieka, render ≤1600 px self-hostowany
w `public/wizytowki/` (koszyk 1280 px — Commons nie serwuje 1600),
zdjęcie na profilu z atrybucją „fot. autor · licencja · Wikimedia
Commons" i miniatury na liście startowej. Dane realne: **26 z 28
parafii ma wizytówkę** (3× Toruń, 23× Gdańsk); 2 braki z przyczynami
w raporcie
[`src/dane/raporty/wizytowki.md`](../src/dane/raporty/wizytowki.md).
Kontrakt: [`11-kontrakt-CHURCH-6.md`](11-kontrakt-CHURCH-6.md).
Wcześniej: **5 — zdjęcia w głosach (`CHURCH-5`).** Głos może nieść do
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
- wdrożenie w konfiguracji darmowej rozstrzygnięte
  ([dokument 12](12-decyzja-wdrozenie-darmowe.md)); otwarte: własna
  domena (blokuje `og:image`), analityka odwiedzin, formalny start
  pilotażu;
- „niedaleko" (odległość), mapka na karcie i nowe kryteria ocen
  (`kazanie`, znaczniki) **nie weszły**: wymagają współrzędnych ze
  źródłem, odwrócenia decyzji o mapie z [dokumentu 01](01-decyzja-mvp-znajdz-swoje-miejsce.md)
  („mapa interaktywna — odłóż") oraz nowej wersji
  [dokumentu 03](03-model-glosow-ocen-i-rankingu.md) (wymiary głosu to
  typ zamknięty) — to praca architekta, nie kodera;
- registry kontraktów nie istnieje; kontrakty w treści `docs/02/05/08/09/10`;
- ocena estetyczna („ślicznie") należy do operatora przy odbiorze.

## Następny krok

BRAK-i wdrożeniowe rozstrzygnięte aktem operatora (konfiguracja
darmowa, czat 2026-08-08; dokumentacja post factum:
[dokument 12](12-decyzja-wdrozenie-darmowe.md)): e-mail — Brevo
(implementacja `DostawcaBrevo` gotowa), hosting statyki — Cloudflare
Pages, harmonogram odświeżania — GitHub Actions (workflow w repo),
serwis zapisu — maszyna operatora (Oracle Free / tunel), domena —
subdomena platformy (własna domena i `og:image` — nadal otwarte).
Kroki wymagające kont operatora wylicza `README.md`, sekcja
„Wdrożenie". Witryna statyczna jest ONLINE (2026-08-09, upload ręczny
buildu): https://curly-recipe-bde5.dontfolditpl.workers.dev — czyta
się wszystko, wizytówki `CHURCH-6` są na niej od 2026-08-10
(sprawdzone z zewnątrz); formularze głosów i zgłoszeń czekają na
uruchomienie serwisu zapisu, a każda kolejna zmiana wymaga ręcznego
wgrania nowej paczki. Kontrakt
[`CHURCH-7` — szlif „subtelny wow"](13-kontrakt-CHURCH-7.md)
(strony miast, filtry faktów, wybór pary, `og:image` z wizytówek przy
`SITE_URL`, tryb ciemny tokenami, arkusz druku, zdyscyplinowany ruch,
stopka zaufania, 404) jest napisany na żądanie operatora z 2026-08-10
— **czeka na akt zatwierdzenia**. Pozostają: integracja publikacji
(Git albo token), serwis zapisu + Brevo, decyzja o pilotażu przy
pokryciu 43,1% oraz odbiór estetyczny `CHURCH-1`–`CHURCH-6`
(„ślicznie" ocenia operator).
