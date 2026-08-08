# 06 — Decyzja architektoniczna: kwalifikacja PB-002 i integracja gałęzi

Data: 2026-08-08 · Autor: architekt · Status: **obowiązuje** — decyzje
podjęte w ramach jawnej delegacji operatora („podejmij decyzje", czat
2026-08-08); każdą może uchylić akt operatora. Brief:
[`PB-002`](briefs/PB-002-oceny-odwiedzajacych-automatyzacja.md)
(zatwierdzony przez operatora, zastępuje
[`PB-001`](briefs/PB-001-porownanie-praktyczne-pilot.md)).

## Kwalifikacja PB-002

**Zbuduj — sekwencją kontraktów, nie jednym skokiem.** Rdzeń briefu
(oceny odwiedzających z autorem i moderacją) jest już zaprojektowany
w [dokumencie 03](03-model-glosow-ocen-i-rankingu.md) i zakontraktowany
w [`CHURCH-2`](05-kontrakt-CHURCH-2.md). Wymagania automatyzacji
(≥90% pokrycia miasta, odświeżanie bez pracy ręcznej, automatyczna
wstępna moderacja) to osobna, duża klasa ryzyka — wchodzą osobnym
kontraktem po sprawdzeniu mechaniki głosów.

Kolejność kontraktów (koryguje zapowiedź z dokumentu 04):

1. **`CHURCH-2`** — głosy end-to-end, moderacja w pełni ludzka,
   miasto: Toruń (uzasadnienie niżej);
2. **`CHURCH-3`** — automatyczne pozyskiwanie i odświeżanie faktów
   ze źródeł publicznych + uruchomienie pilotażu PB-002 w Gdańsku
   (≥90% pokrycia kart); start zegara warunku porażki (8 tygodni);
3. **`CHURCH-4`** — zdjęcia w głosach (przesunięte z dokumentu 04,
   gdzie figurowały jako `CHURCH-3`).

## Gdańsk kontra Toruń — rozstrzygnięcie

Akt operatora w PB-002 wyznacza **Gdańsk jako miasto pilotażu ocen**.
Wcześniejsza delegacja z [dokumentu 01](01-decyzja-mvp-znajdz-swoje-miejsce.md)
dała koderowi wybór miasta startowego — padło na Toruń, dane są
w repozytorium, produkt działa. Te decyzje nie są sprzeczne, bo dotyczą
różnych rzeczy:

- **Toruń** pozostaje miastem **walidacji mechaniki** (ręcznie
  utrzymane fakty, pierwsze głosy, moderacja ludzka) — usuwanie go
  byłoby paleniem działającego dowodu;
- **Gdańsk** startuje razem z automatyzacją w `CHURCH-3`, bo brief
  wprost zakazuje ręcznego kosztu na parafię — ręczne kuratorowanie
  Gdańska łamałoby PB-002, a automatyzowanie go dziś opóźniałoby
  walidację głosów;
- pilotaż i jego warunek porażki (8 tygodni, progi z briefu) liczą się
  **od startu Gdańska**, nie od `CHURCH-2`.

Ograniczenie „dokładnie jedno miasto" z `CHURCH-1` zniesie dopiero
`CHURCH-3`; do tego czasu dane produkcyjne pozostają toruńskie.

## Moderacja — pogodzenie briefu z kontraktem CHURCH-2

PB-002 wymaga automatycznej wstępnej moderacji; `CHURCH-2` wyklucza ją
jako non-goal. Rozstrzygnięcie: **limit operatora 3 h/tydzień z briefu
staje się progiem architektonicznym.** Przy skali `CHURCH-2` (jedno
miasto, start od zera głosów) moderacja w pełni ludzka mieści się
w limicie i daje wzorzec decyzji, na którym później trenuje się
automat. Automatyczna wstępna klasyfikacja wchodzi w `CHURCH-3` —
zanim wolumen Gdańska limit przekroczy, nie po fakcie. Kontrakt
`CHURCH-2` pozostaje bez zmian.

Wymiary ocen: obowiązuje zamknięta piątka z dokumentu 03 (przyjęcie,
muzyka, z dziećmi, dostępność, organizacja). Lista osi z PB-002 jest
w briefie jawnie „propozycją startową" i nie nadpisuje zatwierdzonego
modelu; zmiana wymiarów = nowa wersja dokumentu 03.

## Metryka północna — sposób pomiaru

PB-002 zatwierdza metrykę: **tygodniowa liczba opublikowanych ocen
odwiedzających.** Decyzja pomiarowa: publikacja głosu to plik w repo
(dokument 04), więc metryka liczy się **z historii gita** (data wejścia
pliku głosu do gałęzi głównej), bez żadnej analityki front-endowej
i bez danych osobowych. Metryki diagnostyczne wymagające pomiaru
odwiedzin (odsetek wizyt kończących się oceną, otwarcia udostępnień)
pozostają `BRAK: narzędzie analityki bez danych osobowych` — osobna
decyzja operatora przed startem pilotażu.

## Integracja gałęzi (konstytucja §14)

- **Właściciel integracji: architekt.** Jedyna gałąź integracyjna:
  `claude/church-rating-app-architecture-gnx6tr` — na niej jest
  wykonany `CHURCH-1` z poprawkami i komplet dokumentów.
- Z gałęzi `claude/church-rating-app-pm-ze7w6m` wchodzą **wyłącznie
  dokumenty briefów** (`docs/briefs/PB-001`, `PB-002`) — niniejszą
  decyzją są już na gałęzi integracyjnej. Tamtejsze edycje
  `docs/CURRENT_STATE.md` i `PAMIEC_OPERACYJNA.md` **odrzucone**:
  powstały na bootstrapie sprzed `CHURCH-1` i opisują nieaktualny stan.
- Gałąź PM po tej selekcji jest wchłonięta i nie przyjmuje nowych
  zmian; kolejne ProductBriefy powstają na gałęzi integracyjnej.

## Co pozostaje przy operatorze

1. zatwierdzenie kontraktu `CHURCH-2` (pole w
   [dokumencie 05](05-kontrakt-CHURCH-2.md) — architekt nie zatwierdza
   własnych kontraktów);
2. `BRAK: dostawca e-mail`, `BRAK: hosting`, `BRAK: domena`
   (dokument 04) oraz `BRAK: narzędzie analityki` (wyżej);
3. odbiór estetyczny `CHURCH-1` („ślicznie", dokument 02 akc. 7).
