# 08 — Kontrakt CHURCH-3

Wersja: 1 · Data: 2026-08-08 · Autor: architekt · Typ: feature
(nowe zachowanie — nowe testy muszą być czerwone przed implementacją;
istniejące suity `CHURCH-1`/`CHURCH-2` to preservation: pełna zieleń
przed i po).

**Zatwierdzenie operatora:** zatwierdzony aktem operatora z 2026-08-08
(czat): „proceed" — wydanym w odpowiedzi na `OBJECTION` kodera o pustym
polu zatwierdzenia; wpis uzupełnił architekt, bo dla kodera ten plik
jest tylko do odczytu. Kontrakt jest od tej chwili niemutowalny.

Decyzje, które ten kontrakt realizuje:
[`PB-002`](briefs/PB-002-oceny-odwiedzajacych-automatyzacja.md),
[dokument 06](06-decyzja-kwalifikacja-pb002-i-integracja.md) (kolejność,
Gdańsk jako pilotaż) i [dokument 07](07-decyzja-automatyzacja-faktow-i-wstepnej-moderacji.md)
(lista bazowa, parsery deterministyczne, wstępna moderacja, zasada
„automat nigdy nie publikuje"). Registry kontraktów nie istnieje —
komplet pól obowiązuje w treści tego dokumentu.

## goal

Mieszkaniec Gdańska znajduje kartę niemal każdego kościoła swojego
miasta z faktami ze źródłem i datą, odświeżanymi bez pracy ręcznej,
a błąd w fakcie zgłasza jednym kliknięciem.

## acceptance

Wszystkie stany obserwowalne; „pipeline" znaczy: komendy npm
uruchamialne lokalnie, testowane na zarchiwizowanych fixture'ach HTML
(mock systemu zewnętrznego); „panel" znaczy: panel moderacji serwisu
z `CHURCH-2`.

1. `npm run verify` pozostaje bramką i jest zielone; `README.md`
   wylicza komendy pipeline'u (pozyskanie, odświeżenie, raport
   pokrycia) obok bramki.
2. Lista bazowa Gdańska istnieje jako plik danych ze schematem (Zod):
   każda pozycja ma nazwę, wyznanie i źródło z katalogu oficjalnego
   (URL + data odczytu); pozycja bez źródła jest odrzucana przez
   schemat (przypadek czerwony w suicie). Wspólnoty bez publicznego
   katalogu wyznania są poza listą — plik dokumentuje ten fakt.
3. Parser katalogu archidiecezji gdańskiej (i każdego dodanego
   katalogu) jest deterministyczny i testowany na fixture'ach HTML
   zarchiwizowanych w repo z URL-em i datą pobrania; z fixture'a
   generuje rekordy przechodzące schemat parafii z `CHURCH-1`;
   rekord poniżej progu jakości z dokumentu 07 (nazwa, wyznanie,
   adres, msze niedzielne) nie wchodzi do danych — przypadek czerwony
   istnieje; przypadki wątpliwe lądują w wyliczonym raporcie wyjątków,
   nie w danych.
4. Dane Gdańska wygenerowane pipeline'em wchodzą do repo tym
   kontraktem; komenda raportu pokrycia liczy odsetek listy bazowej
   z kartą nad progiem: wynik ≥90% **albo** raport braków wskazujący
   per pozycja przyczynę źródłową (katalog niedostępny, struktura
   nieparsowalna, poniżej progu jakości) — raport jest plikiem w repo,
   a wybór ścieżki odnotowany w `docs/CURRENT_STATE.md`; start
   pilotażu poniżej 90% pozostaje decyzją operatora.
5. Odświeżanie: komenda porównuje źródło ze stanem repo; test na
   fixture'ach dowodzi, że zmiana wartości w źródle daje diff pliku
   z nową `dataOdczytu`, a niezmienione źródło nie daje żadnego diffu.
6. Strona startowa oferuje wybór miasta (Toruń, Gdańsk) działający bez
   JavaScriptu; profile, porównania i ranking działają w obrębie
   jednego miasta; test danych dopuszcza dokładnie miasta z zamkniętej
   listy w danych; suity `CHURCH-1`/`CHURCH-2` pozostają zielone.
7. Każda karta parafii ma link „zgłoś błąd" prowadzący do formularza
   zwykłego POST; zgłoszenie zapisuje się trwale w bazie serwisu przed
   odpowiedzią i jest widoczne w panelu z adresem karty i treścią —
   testy integracyjne na bazie w pamięci.
8. Wstępna moderacja głosów: klasyfikator regułowy z testami; automat
   samodzielnie odrzuca wyłącznie twarde przypadki z listy dokumentu 07,
   zawsze z powodem i flagą odwołania; test asercyjny dowodzi, że żadna
   ścieżka automatu nie ustawia statusu `approved` ani nie tworzy pliku
   w katalogu danych; przypadki graniczne dostają podpowiedź w panelu.
9. Panel pokazuje rozmiar kolejki moderacji (głosy + zgłoszenia błędów)
   i wiek najstarszej pozycji — limit operatora 3 h/tydzień staje się
   mierzalny.
10. Bezpieczniki bez zmian: zero agregacji po wyznaniu także w danych
    wielomiastowych (test asercyjny obejmuje Gdańsk); ranking per
    miasto z progiem ≥5 i fail-closed; treści UI opisują, nie oceniają
    wyznań.
11. Strony Gdańska realizują te same tokeny wizualne; ocena estetyczna
    („ślicznie") należy do operatora przy odbiorze.

## non_goals

- publiczny start pilotażu i zegar 8 tygodni (wymaga hostingu, domeny,
  dostawcy e-mail — BRAK-i operatora);
- narzędzie analityki odwiedzin (diagnostyka PB-002) — osobna decyzja;
- LLM w ścieżce prawdy faktów lub w decyzji moderacyjnej;
- automatyczna publikacja głosów (approve tylko człowiek — dokument 07);
- zdjęcia w głosach (`CHURCH-4`), odpowiedzi parafii, monetyzacja;
- miasta poza Toruniem i Gdańskiem.

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

`CONSTITUTION.md`, `PROMPT_*.md`, `docs/01-…` – `docs/08-…`,
`docs/briefs/**` — tylko do odczytu. `PAMIEC_OPERACYJNA.md` —
wyłącznie zgodnie z jej protokołem.

## verification

```bash
npm ci
npm run verify
```

Czerwień lub brak = brak dowodu; deklaracja nie jest dowodem.

## Uwagi wykonawcze

- pipeline pobiera z żywych katalogów wyłącznie przy generowaniu
  danych (z uczciwym User-Agentem i odstępami); testy nigdy nie
  dotykają sieci — wyłącznie fixture'y z datą pobrania;
- nowe zależności spodziewane: jeden parser HTML (np. `node-html-parser`)
  z obroną i planem usunięcia; nic poza tym bez obrony w opisie commita;
- dane Gdańska są realne — zero zmyślonych rekordów; parafia, której
  źródło nie potwierdza, nie istnieje w danych;
- dwa raporty w opisie commita: `behavior_delta` i `hygiene_delta`;
- po zieleni koder aktualizuje `docs/CURRENT_STATE.md` (etap 2 → 3)
  w granicach `allowed_paths`.
