# 07 — Decyzja architektoniczna: automatyzacja faktów i wstępnej moderacji

Data: 2026-08-08 · Autor: architekt · Status: **obowiązuje z chwilą
zatwierdzenia kontraktu [`CHURCH-3`](08-kontrakt-CHURCH-3.md) przez
operatora**. Wymagania produktowe:
[`PB-002`](briefs/PB-002-oceny-odwiedzajacych-automatyzacja.md);
kolejność kontraktów: [dokument 06](06-decyzja-kwalifikacja-pb002-i-integracja.md).

## Kontekst

PB-002 wymaga: ≥90% kościołów miasta pilotażu (Gdańsk) z kartą faktów
pozyskanych automatycznie, odświeżania bez pracy ręcznej, zgłoszenia
błędu jednym kliknięciem i automatycznej wstępnej moderacji ocen.
Schemat danych już mechanizuje „fakt bez źródła nie wchodzi" — pipeline
musi go po prostu zasilać.

## Decyzja 1 — lista bazowa miasta (mianownik pokrycia)

„90% kościołów miasta" wymaga policzalnego mianownika. Lista bazowa
miasta powstaje **wyłącznie z oficjalnych, publicznych katalogów
kościołów i związków wyznaniowych** obecnych w mieście (dla Gdańska:
katalog parafii archidiecezji gdańskiej oraz publiczne katalogi innych
wyznań, o ile istnieją). Każda pozycja listy nosi źródło i datę
odczytu. Wspólnoty bez publicznego katalogu są jawnie poza mianownikiem
— to zapisany fakt, nie przemilczenie. Pokrycie = odsetek pozycji
listy bazowej mających kartę nad progiem jakości.

## Decyzja 2 — pozyskiwanie deterministyczne, bez LLM w ścieżce prawdy

Fakty ekstrahują **deterministyczne parsery** katalogów o stabilnej
strukturze; strona własna parafii jest źródłem wtórnym tylko tam, gdzie
struktura jest jednoznaczna. Model językowy nie dotyka ścieżki prawdy:
błędna halucynacja godzin mszy to dokładnie ta szkoda, przed którą
produkt ma chronić. Rekord poniżej progu jakości (minimum: nazwa,
wyznanie, adres, msze niedzielne — każdy fakt ze źródłem i datą) nie
wchodzi do danych; wątpliwe przypadki trafiają do kolejki wyjątków
ręcznych, którą brief jawnie dopuszcza.

## Decyzja 3 — droga zapisu danych pozostaje drogą PR

Pipeline generuje i aktualizuje pliki danych lokalnie/na gałęzi; do
gałęzi integracyjnej wchodzą przez pull request z diffem. Odświeżanie:
cykliczne uruchomienie porównuje źródło ze stanem repo — zmiana daje
diff z nową `dataOdczytu`, brak zmiany nie daje niczego. Harmonogram
uruchomień zależy od platformy CI (`BRAK: hosting/CI` operatora);
do tego czasu komenda lokalna.

## Decyzja 4 — zgłoszenie błędu faktu

Każda karta ma link „zgłoś błąd" prowadzący do zwykłego formularza
POST serwisu zapisu (istnieje od `CHURCH-2`). Zgłoszenie ląduje
w kolejce moderacji z adresem karty i treścią; poprawka faktu ma
pierwszeństwo przed rozwojem funkcji (PB-002).

## Decyzja 5 — automatyczna wstępna moderacja: automat nigdy nie publikuje

Klasyfikator **regułowy** (listy wzorców: dane kontaktowe osób
trzecich, wulgaryzmy, frazy porównujące wyznania), bez LLM na start:

- automat może **samodzielnie odrzucać wyłącznie twarde przypadki**
  (np. numer telefonu w tekście publicznym) — zawsze z powodem
  i z kanałem odwołania;
- **`approved` ustawia wyłącznie człowiek** — pierwsza fala krzywdy
  przy publikacji jest nieodwracalna (dokument 03), więc fail-safe
  leży po stronie publikacji;
- przypadki czyste i graniczne różnią się tylko podpowiedzią automatu
  w panelu; kolejka raportuje swój rozmiar i wiek najstarszej pozycji,
  żeby limit operatora 3 h/tydzień był mierzalny, nie deklarowany.

## Decyzja 6 — wielomiastowość

Ograniczenie „dokładnie jedno miasto" z `CHURCH-1` zostaje zniesione:
strona startowa daje wybór miasta (Toruń, Gdańsk) działający bez
JavaScriptu; adresy `/parafia/<miasto>/<slug>` już są na to gotowe;
ranking i porównania działają w obrębie jednego miasta.

## Warianty odrzucone

- **LLM-ekstrakcja faktów** — niedeterministyczna ścieżka prawdy,
  halucynacje w godzinach mszy; wraca najwyżej jako podpowiedź
  w kolejce wyjątków, nigdy jako źródło zapisu;
- **scraping map (Google/OSM) jako źródło faktów** — dane bez
  gwarancji pochodzenia i licencji; katalogi wyznań są źródłem
  pierwotnym;
- **automat publikujący czyste głosy** — oszczędza minuty, ryzykuje
  nieodwracalną krzywdę; odrzucone do czasu, aż wolumen realnie
  przekroczy limit operatora i decyzję podejmie nowy dokument;
- **osobna baza pokrycia poza repo** — lista bazowa to też fakty ze
  źródłem; żyje w repo jak wszystkie fakty.

## BRAK — decyzje należące do operatora

Bez zmian (dokumenty 04, 06): dostawca e-mail, hosting/CI, domena,
narzędzie analityki odwiedzin. Start publiczny pilotażu Gdańska
(i zegara 8 tygodni) to osobny akt operatora po rozstrzygnięciu
hostingu.
