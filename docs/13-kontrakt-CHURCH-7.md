# 13 — Kontrakt CHURCH-7: szlif — subtelny wow

Wersja: 1 · Data: 2026-08-10 · Autor: architekt · Typ: feature
(nowe zachowanie — nowe testy muszą być czerwone przed implementacją;
suity `CHURCH-1`–`CHURCH-6` to preservation: pełna zieleń przed i po).

**Zatwierdzenie operatora:** _niewypełnione — kontrakt staje się
wykonywalny wyłącznie po jawnym akcie operatora._

Żądanie operatora (czat 2026-08-10): „analizuj obecny stan, zaprojektuj
ulepszenia, które dadzą efekt wow, ale subtelnie — funkcjonalności
i estetyka". Projekt poniżej wynika z przeglądu architekta na żywym
buildzie (zrzuty mobil/desktop wszystkich ekranów). Zasady niezmienne:
tokeny dokumentu 01, zero CDN-ów i fontów dosyłanych, strony w pełni
czytelne bez JavaScriptu, JS wyłącznie tam, gdzie dokument 01 jawnie
go dopuszcza (wybór pary, filtrowanie), `prefers-reduced-motion`
wyłącza ruch.

## Analiza — co dziś osłabia wrażenie

1. Start to jedna długa strona: Gdańsk (26 parafii) spycha Toruń
   ~10 ekranów w dół; piguły miast są tylko kotwicami.
2. Wyłonienia przy przewijaniu działają na każdym z 26 wierszy —
   „szept" zamienia się w tik.
3. Obietnica z makiety („np. msza z dziećmi · wejście bez schodów ·
   transmisja online") nie ma dziś żadnego wejścia w produkt.
4. Porównanie dwóch parafii dostępne wyłącznie z profilu; na liście
   miasta nie da się zestawić dowolnej pary.
5. Udostępnienie linku nie pokazuje obrazu (jest publiczny adres,
   a `og:image` wciąż nie istnieje) — a wizytówki `CHURCH-6` już są.
6. Brak trybu ciemnego, brak arkusza druku, brak strony 404; drobiazg:
   „Zgłoś błąd— poprawka" bez spacji przed myślnikiem.

## goal

Osoba trafiająca z udostępnionego linku widzi piękny podgląd
z kościołem, ląduje na stronie swojego miasta, w dwa dotknięcia filtruje
parafie po faktach albo zestawia dowolne dwie — a całość wygląda
równie spokojnie w dzień, w nocy i na wydruku.

## acceptance

1. `npm run verify` pozostaje bramką i jest zielone.
2. **Strony miast**: `/torun` i `/gdansk` (lista parafii + ranking
   miasta); strona startowa staje się bramą — hero i karta każdego
   miasta (nazwa serifem, liczba parafii, do trzech miniatur
   wizytówek); test builda dowodzi istnienia stron miast i obecności
   kart na starcie; stare kotwice `/#miasto-…` przekierowane albo
   zachowane.
3. **Strony-filtry faktów**: dla każdego miasta i każdej osi
   z zamkniętej listy, dla której istnieje ≥ 1 parafia z faktem,
   powstaje statyczna strona `/<miasto>/<filtr>` (np.
   `/torun/msza-z-dziecmi`, `/gdansk/spowiedz-poza-msza`) z listą
   pasujących parafii i wartościami ich faktów; oś bez danych nie
   generuje strony (test); wejścia do filtrów widoczne na stronie
   miasta jako ciche linki w stylu wskazówek makiety; dobór parafii
   do filtra to czysta funkcja z testami (czerwonymi przed
   implementacją) — kwalifikacja wyłącznie z istnienia/treści osi
   faktów, żadnych ocen.
4. **Wybór pary**: na stronie miasta formularz dwóch pól wyboru
   prowadzący do kanonicznego adresu porównania; funkcjonalność jest
   ulepszeniem JS (dokument 01 jawnie dopuszcza), bez JS formularz
   nie jest renderowany jako martwy element (test: HTML bez JS nie
   zawiera niedziałającego przycisku); pierwsza kolumna tabeli
   porównania przyklejona przy przewijaniu poziomym (czysty CSS).
5. **Udostępnianie**: build przyjmuje `SITE_URL` (env); gdy ustawione,
   strony emitują `og:url` i absolutny `og:image` — dla profilu
   wizytówka parafii, dla porównania wizytówka pierwszej alfabetycznie
   parafii pary, dla pozostałych stron brak obrazu zamiast obrazu
   fałszywego; przy braku `SITE_URL` build przechodzi bez tych tagów
   (test obu wariantów); `sitemap.xml` i `robots.txt` generowane przy
   ustawionym `SITE_URL`.
6. **Tryb ciemny**: wyłącznie przez `prefers-color-scheme`, tokenami
   (bez JS): tło `#15181A`→papier nocny `#171A18`, atrament jasny
   `#E9E7DD`, przygaszona zieleń rozjaśniona do kontrastu ≥ 4,5:1 na
   ciemnych tłach, linie i cienie stonowane; wizytówki i zdjęcia bez
   filtrów; test kontrastu tokenów rozszerzony o parę nocną (czerwony
   przed implementacją); z chwilą zatwierdzenia tego kontraktu sekcja
   ta stanowi aneks tokenów nocnych do dokumentu 01.
7. **Arkusz druku**: `@media print` dla profilu i porównania — bez
   nawigacji, przycisków i cieni, czarny tekst na białym, źródła
   faktów jako zwykły tekst; profil parafii mieści się na jednej–dwóch
   stronach A4 (starsi użytkownicy drukują).
8. **Ruch zdyscyplinowany**: wyłonienia sekcji zamiast pojedynczych
   wierszy dla list dłuższych niż 8 pozycji; kaskada opóźnień tylko
   dla pierwszych trzech elementów; `prefers-reduced-motion` bez
   zmian; nawigacja między stronami z łagodnym przejściem (View
   Transitions Astro — natywne, bez zależności), wyłączonym przy
   reduced-motion; bez JS nawigacja zwykła (test builda: strony nie
   wymagają skryptu).
9. **Stopka zaufania**: każda strona pokazuje w stopce datę ostatniej
   zmiany danych (najnowsza `dataOdczytu`/`dataPobrania` z danych
   builda — deterministycznie z plików, nie z zegara); test funkcji.
10. **Strona 404**: papier, serif, „nie ma takiej strony" i wejścia do
    miast; ton opisowy.
11. Drobiazgi: spacja przy „Zgłoś błąd — poprawka…", `text-wrap:
    pretty` dla akapitów i wartości faktów; bez poziomego przewijania
    łamu na 320 px.
12. Suity `CHURCH-1`–`CHURCH-6` zielone przed i po; bezpieczniki bez
    zmian (zero agregacji po wyznaniu, ranking per miasto, fail-closed,
    treści opisowe); ocena „ślicznie" należy do operatora przy odbiorze.

## non_goals

- wyszukiwarka pełnotekstowa i mapy;
- personalizacja, zapamiętywanie wyborów, jakiekolwiek ciasteczka;
- animacje ozdobne, parallax, ikony dekoracyjne — ruch pozostaje
  szeptem;
- zmiana palety dziennej i typografii dokumentu 01;
- nowe osie faktów; filtry wyłącznie z istniejącej zamkniętej listy;
- start pilotażu, analityka, własna domena (osobne decyzje operatora).

## allowed_paths

```
src/**
public/**
tests/**
serwer/**
narzedzia/**
package.json
package-lock.json
astro.config.*
tsconfig.json
.gitignore
README.md
docs/CURRENT_STATE.md
```

`CONSTITUTION.md`, `PROMPT_*.md`, `docs/01-…` – `docs/13-…`,
`docs/briefs/**` — tylko do odczytu. `PAMIEC_OPERACYJNA.md` —
wyłącznie zgodnie z jej protokołem.

## verification

```bash
npm ci
npm run verify
```

Czerwień lub brak = brak dowodu; deklaracja nie jest dowodem.

## Uwagi wykonawcze

- View Transitions: użyć wbudowanego wsparcia Astro; morph wizytówki
  i nazwy parafii między listą a profilem tam, gdzie przeglądarka
  wspiera; zero bibliotek;
- adresy filtrów: slugi osi z zamkniętej mapy w `src/lib` (nie
  z etykiet), z testem stabilności adresów;
- `SITE_URL` dokumentowane w README obok `PUBLIC_ZAPIS_URL`;
- żadnych nowych zależności bez obrony w opisie commita;
- dwa raporty w opisie commita: `behavior_delta` i `hygiene_delta`;
- po zieleni koder aktualizuje `docs/CURRENT_STATE.md`
  w granicach `allowed_paths`.
