# ProductBrief PB-002 — oceny odwiedzających na zautomatyzowanym katalogu

Status: **czeka na zatwierdzenie operatora** · autor: PM · 2026-08-08
Zastępuje [`PB-001`](PB-001-porownanie-praktyczne-pilot.md) decyzją
operatora: rdzeniem produktu są oceny odwiedzających, a pozyskiwanie
i utrzymanie danych ma być mocno zautomatyzowane.
Wynik kwalifikacji PM: **buduj (zakres pilotażowy)** — pętli ocen nie da
się zwalidować taniej niż realnym produktem przyjmującym realne oceny;
zakres ograniczony do jednego miasta trzyma koszt eksperymentu.

## Interpretacja polecenia operatora (do potwierdzenia przy zatwierdzeniu)

- „mocny automatyzm" = fakty o kościołach pozyskiwane i odświeżane
  automatycznie z publicznych źródeł (koszt ręczny na parafię bliski
  zeru) **oraz** automatyczna wstępna moderacja ocen z człowiekiem
  wyłącznie od przypadków granicznych;
- „podstawa oceny odwiedzających" = kartą kościoła rządzą oceny osób,
  które w nim były; warstwa faktów jest fundamentem wiarygodności,
  nie produktem samym w sobie.

## Problem i segment

Wybierający kościół (przeprowadzka, odwiedziny, poszukiwanie wspólnoty)
znajdzie w sieci co najwyżej godziny mszy — nie znajdzie doświadczeń
innych ludzi: jak przyjmowani są goście, jaka jest muzyka, czy działa
wspólnota. Jedyne dziś miejsce takich opinii to rozproszone recenzje
map, pisane bez struktury i bez wrażliwości tematu.

Segmenty pilotażu: **wybierający** (czytają oceny) i **odwiedzający
z doświadczeniem** (wystawiają oceny: parafianie i goście).

## Hipoteza

Jeśli w mieście pilotażu opublikujemy automatycznie zasilony katalog
kościołów (fakty ze źródłem i datą) i pozwolimy odwiedzającym wystawiać
ustrukturyzowane, moderowane oceny własnego doświadczenia, to:

1. wybierający będą wracać do kart z ocenami zamiast do surowych godzin
   mszy (oceny podnoszą wartość karty);
2. parafianie — z dumy ze swojej wspólnoty — będą oceniać i udostępniać
   kartę własnej parafii, ściągając kolejnych oceniających.

## Pętla wzrostu (kto → komu → dlaczego → co widzi odbiorca)

- pętla dumy: parafianin ocenia swoją parafię → udostępnia kartę
  wspólnocie i znajomym („nasza parafia w Church") → odbiorcy dodają
  własne oceny → karta rośnie i przyciąga wybierających;
- pętla użyteczności: wybierający dostaje od bliskiego link karty
  lub porównania z ocenami → po własnej wizycie zostawia ocenę;
- odbiorca linku zawsze widzi: fakty ze źródłem, oceny z autorstwem,
  zaproszenie „byłeś tu? oceń swoje doświadczenie".

## Kształt ocen (wymagania produktowe, nie architektura)

- ocena ma zawsze autora z kontem; publicznie pseudonim, wewnętrznie
  rozliczalność; droga usunięcia konta i ocen zaprojektowana od początku;
- osie zdefiniowane i wartościujące wyłącznie własne doświadczenie
  wizyty, nigdy wyznanie ani osoby (propozycja startowa: przyjęcie
  gościa, muzyka i liturgia jako doświadczenie, dostępność
  i organizacja, żywotność wspólnot); skala + opcjonalny tekst;
- tekst publikowany dopiero po moderacji: automatyczna wstępna
  klasyfikacja, kolejka ludzka dla granicznych, kanał odwołań
  i zgłoszeń; ataki personalne, kpina z praktyk religijnych
  i treści międzywyznaniowo konfliktowe nie przechodzą nigdy;
- moderacja jest funkcją pierwszej klasy: brief bez niej byłby
  niekompletny, produkt bez niej nie startuje.

## Automatyzacja (wymagania produktowe)

- start pilotażu wymaga, by ≥90% kościołów miasta miało kartę z faktami
  pozyskanymi automatycznie, każdy fakt ze źródłem i datą widocznymi
  w interfejsie;
- odświeżanie faktów bez pracy ręcznej; ręcznie wyłącznie wyjątki
  i zgłoszone błędy;
- zgłoszenie błędu w fakcie jednym kliknięciem; błąd godzin mszy to
  realna szkoda, więc poprawka ma pierwszeństwo przed rozwojem funkcji.

## Metryki

- propozycja metryki północnej (decyzja operatora): **tygodniowa liczba
  opublikowanych ocen odwiedzających** — mierzy jednocześnie wartość
  (ktoś zadał sobie trud), zaufanie (przeszła moderację) i wzrost
  (oceny przyciągają wybierających);
- diagnostyka: odsetek odwiedzin karty kończących się oceną, odsetek
  kart z ≥3 ocenami, udostępnienia kart i ich otwarcia, odrzuty
  moderacji, zgłoszenia błędów faktów;
- metryki próżności (suma odsłon, liczba kart) nie wchodzą do raportów.

## Warunek porażki

Hipoteza jest obalona, jeżeli po 8 tygodniach pilotażu w jednym mieście:

- mniej niż 1% odwiedzin karty kończy się przesłaną oceną, **lub**
- mniej niż 10% kart pilotażu ma ≥3 opublikowane oceny, **lub**
- utrzymanie jakości wymaga stałej pracy ręcznej przy faktach lub
  moderacji przekraczającej limit czasu zadeklarowany przez operatora
  przy zatwierdzeniu.

Obalenie kończy iterację raportem: pivot (np. powrót do porównania
faktów z PB-001) albo odrzucenie kierunku. Progi koryguje operator.

## Ryzyka wrażliwości i mitygacje

- ocena parafii odczytana jako ocena wiary lub kapłana → osie dotyczą
  wyłącznie doświadczenia wizyty; treści o nazwanych osobach i o
  „lepszości" wyznań odrzuca moderacja; zero rankingu wyznań;
- kpina i ośmieszanie praktyk (paliwo taniej wirusowości) → twarde
  reguły moderacji przed publikacją; wzrost budujemy na dumie
  wspólnot, nie na zgorszeniu — to czerwona linia konstytucyjna;
- review-bombing i konflikt między wspólnotami → konto wymagane,
  limity częstości, monitorowanie anomalii na karcie, możliwość
  zamrożenia karty do wyjaśnienia;
- fałszywe oceny „podbijające" własną parafię → rozliczalność autora,
  wykrywanie wzorców; skala problemu mierzona, nie zakładana;
- błędy automatycznego pozyskania faktów niszczą zaufanie → publikacja
  karty tylko nad progiem jakości, źródło i data przy każdym fakcie,
  szybka ścieżka poprawki;
- prywatność → dane osobowe tylko tam, gdzie konto ich jawnie wymaga;
  droga usunięcia projektowana razem z drogą zapisu.

## Non-goals tej iteracji

- żadnego rankingu wyznań ani osi porównującej religie;
- żadnej oceny imiennie wskazanych osób;
- żadnej monetyzacji, profili „oficjalnych" parafii, odpowiedzi parafii
  na oceny (osobny brief, osobna wrażliwość);
- jedno miasto pilotażu — nie obiecujemy pokrycia kraju;
- nie mierzymy retencji długoterminowej — wyłącznie pętlę ocen.

## Koszt alternatywy

Budując to, odkładamy: czysty test porównywarki faktów (PB-001),
rozszerzenie geograficzne, funkcje dla parafii. Przyjmujemy też wyższy
koszt wejścia niż landing PB-001 — świadomie, bo decyzja operatora
przenosi walidację z „czy fakty są warte udostępnienia" na „czy ludzie
będą oceniać" — a tego nie sprawdzi atrapa.

## BRAK — do decyzji operatora przed przekazaniem architektowi

- `BRAK: zatwierdzenie interpretacji polecenia` — sekcja wyżej;
- `BRAK: miasto pilotażu` — wybór wymaga wiedzy operatora o rynku;
- `BRAK: metryka północna` — propozycja wyżej;
- `BRAK: limit czasu operatora na moderację graniczną` — wchodzi do
  warunku porażki;
- `BRAK: zatwierdzenie briefu` — PM nie zatwierdza własnych briefów.
