# ProductBrief PB-001 — praktyczne porównanie kościołów jednej dzielnicy

Status: **czeka na zatwierdzenie operatora** · autor: PM · 2026-08-08
Wynik kwalifikacji PM: **eksperymentuj** (najtańszy eksperyment przed
jakąkolwiek budową; kod jest ostatnią formą walidacji).

## Problem i segment

Osoba, która musi wybrać kościół poza swoją rutyną — po przeprowadzce,
w odwiedzinach, szukając mszy z dojazdem, spowiedzi przed pracą, wejścia
bez schodów dla starszego rodzica — nie ma dziś jednego miejsca
z porównywalnymi, aktualnymi faktami. Strony parafialne są rozproszone
i często nieaktualne; agregatory godzin mszy nie porównują cech.

Segment pilotażu: **pomagający bliskiemu** oraz **świeżo przybyli**
(przeprowadzka, studia, dłuższy pobyt) w jednej dzielnicy jednego miasta.

## Hipoteza

Jeśli opublikujemy porównanie wszystkich kościołów rzymskokatolickich
jednej dzielnicy po jawnie zdefiniowanych, mierzalnych cechach
(godziny mszy i spowiedzi, dostępność bez barier, parking, rodzaj muzyki,
wspólnoty, języki mszy, dojazd), to użytkownicy z segmentu udostępnią
widok konkretnej osobie, której pomagają — bo odpowiedź jest kompletna,
wiarygodna i warta przekazania — a odbiorcy ją otworzą.

## Pętla udostępnień (kto → komu → dlaczego → co widzi odbiorca)

- kto: osoba pomagająca bliskiemu w wyborze (albo wybierająca dla siebie
  i dzieląca się znaleziskiem);
- komu: konkretny bliski — rodzic, znajomy po przeprowadzce, gość;
- dlaczego: udostępnienie oszczędza bliskiemu pracę i mówi „pomyślałem
  o tobie";
- co widzi odbiorca: trwały link z czytelnym podglądem, przefiltrowane
  porównanie lub kartę kościoła z faktami i źródłami oraz zaproszenie
  „sprawdź swoją okolicę" (zapis na listę oczekujących).

## Metryki

- metryka eksperymentu: odsetek sesji z użyciem „wyślij bliskiemu" oraz
  odsetek udostępnień otwartych przez odbiorcę;
- propozycja metryki północnej produktu (decyzja operatora):
  **tygodniowa liczba otwartych udostępnionych porównań** — mierzy
  jednocześnie wartość (ktoś uznał treść za wartą przekazania)
  i wirusowość (odbiorca faktycznie ją skonsumował);
- diagnostyka (nie raportowana jako sukces): wizyty, zapisy na listę
  oczekujących, zgłoszenia błędów w danych.

## Warunek porażki

Hipoteza jest obalona, jeżeli po osiągnięciu 200 unikalnych odwiedzin
strony porównania (maks. 4 tygodnie od startu pomiaru):

- mniej niż 5% sesji użyło „wyślij bliskiemu", **lub**
- mniej niż 30% udostępnień zostało otwartych przez odbiorcę.

Obalenie kończy iterację raportem i decyzją: pivot osi wartości albo
odrzucenie kierunku. Progi może skorygować operator przy zatwierdzeniu.

## Najtańszy eksperyment

Statyczna strona-porównanie dla jednej dzielnicy (15–25 kościołów):

- dane zebrane ręcznie z publicznych źródeł (strony parafii, informator
  diecezjalny, ogłoszenia); każdy fakt ze źródłem i datą weryfikacji,
  widocznymi w interfejsie;
- zgłaszanie błędu w danych jednym kliknięciem (kanał do operatora);
- „wyślij bliskiemu" generuje trwały link konkretnego widoku;
- lista oczekujących „twoja okolica" — wyłącznie adres e-mail za zgodą;
- zero kont, zero treści użytkowników, zero ocen.

## Ryzyka wrażliwości i mitygacje

- odczytanie porównania jako rankingu parafii → brak jakiejkolwiek oceny
  łącznej, gwiazdek i kolejności „od najlepszego"; sortowanie wyłącznie
  alfabetyczne lub po odległości; osie opisowe, nie wartościujące
  (np. „organy / schola / zespół", nigdy „jakość muzyki");
- błędny fakt (np. godzina mszy) wyrządza realną szkodę → każdy fakt ma
  źródło i datę, widoczną ścieżkę zgłoszenia błędu i poprawki przed
  jakąkolwiek promocją strony;
- konflikt między wspólnotami → pilotaż obejmuje jedno wyznanie, więc
  żadna oś nie porównuje wyznań; rozszerzenie międzywyznaniowe wymaga
  osobnego briefu i osobnej analizy wrażliwości;
- prywatność → brak danych osobowych poza dobrowolnym e-mailem listy
  oczekujących, z opisaną drogą usunięcia.

## Non-goals tej iteracji

- żadnych ocen ani recenzji użytkowników — dlatego moderacja UGC nie
  jest jeszcze potrzebna; brief zakładający UGC musi ją zaprojektować;
- żadnego rankingu kościołów ani porównań między wyznaniami;
- żadnej automatyzacji pozyskiwania danych (scraping) — dane ręczne;
- żadnej aplikacji mobilnej, kont użytkowników, personalizacji;
- nie mierzymy retencji ani powrotów — wyłącznie pętlę udostępnień;
- nie obiecujemy pokrycia innych obszarów niż dzielnica pilotażu.

## Koszt alternatywy

Robiąc to, odkładamy: katalog wielu miast, oceny społecznościowe
z moderacją, automatyczne zasilanie danych. Świadomie: każda z tych
rzeczy bez zwalidowanej pętli wartości byłaby budową na zgadywaniu.

## BRAK — do decyzji operatora przed startem

- `BRAK: miasto i dzielnica pilotażu` — wybór wymaga wiedzy operatora
  o docelowym rynku i możliwości ręcznej weryfikacji danych na miejscu;
- `BRAK: zatwierdzenie metryki północnej` — propozycja wyżej;
- `BRAK: zatwierdzenie briefu` — PM nie zatwierdza własnych briefów.
