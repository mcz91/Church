# 02 — Kontrakt CHURCH-1

Wersja: 1 · Data: 2026-08-08 · Autor: architekt · Typ: feature
(nowe zachowanie — nowe testy muszą być czerwone przed implementacją).

**Zatwierdzenie operatora:** _(puste — wypełnia wyłącznie akt operatora;
do tego momentu kontrakt nie jest wykonywalny)_

Decyzje, które ten kontrakt realizuje:
[`01-decyzja-mvp-znajdz-swoje-miejsce.md`](01-decyzja-mvp-znajdz-swoje-miejsce.md).
Registry kontraktów nie istnieje (etap 0), więc komplet pól obowiązuje
w treści tego dokumentu.

## goal

Osoba szukająca swojego miejsca znajduje w wybranym mieście parafie,
czyta o nich wyłącznie fakty ze źródłem i datą, porównuje dwie obok
siebie i udostępnia trwały link, który u odbiorcy wygląda poprawnie.

## acceptance

Wszystkie stany obserwowalne; „strona" znaczy: wygenerowany statycznie
dokument HTML w katalogu builda.

1. `npm run verify` istnieje, wykonuje kolejno lint, `astro check`,
   testy jednostkowe i pełny build, i kończy się zielono; `README.md`
   wylicza te komendy jako bramkę repozytorium.
2. Test jednostkowy dowodzi, że rekord parafii zawierający fakt **bez
   źródła lub bez daty** jest odrzucany przez schemat danych (przypadek
   czerwony istnieje w suicie i przechodzi jako oczekiwane odrzucenie).
3. Dane zawierają dokładnie jedno miasto startowe i co najmniej trzy
   realne parafie; każdy fakt każdej parafii ma źródło publiczne
   (URL strony parafii, diecezji lub równoważne) i datę odczytu.
4. Strona profilu parafii pokazuje wszystkie fakty rekordu, a przy
   każdym fakcie widoczne jest jego źródło i data.
5. Strona porównania pary parafii istnieje pod adresem
   `/porownaj/<slug-a>-vs-<slug-b>`, gdzie slugi są w porządku
   alfabetycznym; test jednostkowy dowodzi, że dla pary podanej
   w odwrotnej kolejności wyznaczany jest ten sam kanoniczny adres;
   strona pokazuje obok siebie wartości osi z zamkniętej listy
   dokumentu 01 i żadnej osi spoza niej.
6. Każda strona profilu i porównania ma tytuł, opis i tagi Open Graph
   zawierające nazwy właściwych parafii.
7. Strony renderują się poprawnie na szerokości mobilnej i desktopowej
   (build przechodzi, brak poziomego przewijania łamu treści), a język
   wizualny realizuje tokeny z dokumentu 01; ocenę estetyczną
   („ślicznie") wydaje operator przy odbiorze — nie jest mechanizowalna.
8. Żaden plik danych, komponent ani treść nie wyraża oceny jakości lub
   „lepszości" wyznania czy parafii; grep po zdefiniowanych osiach
   potwierdza wyłącznie fakty opisowe.

## non_goals

- oceny, recenzje i jakakolwiek treść od użytkowników (osobny kontrakt);
- konta, logowanie, dane osobowe w dowolnej formie;
- backend, baza danych, API;
- analityka i pomiar metryki północnej (osobna decyzja operatora);
- mapa interaktywna;
- więcej niż jedno miasto;
- ranking, punktacja lub porównywanie wyznań — zakaz trwały;
- wybór domeny, hosting i publikacja produkcyjna.

## allowed_paths

```
src/**
public/**
tests/**
package.json
package-lock.json
astro.config.*
tsconfig.json
.gitignore
README.md
docs/CURRENT_STATE.md
```

`CONSTITUTION.md`, `PROMPT_*.md`, `docs/01-*.md`, `docs/02-*.md` — tylko
do odczytu. `PAMIEC_OPERACYJNA.md` — wyłącznie zgodnie z jej protokołem.

## verification

```bash
npm ci
npm run verify
```

`npm run verify` = lint + `astro check` + testy jednostkowe + build.
Kontrakt ustanawia te komendy; ich brak lub czerwień = brak dowodu,
a deklaracja nie jest dowodem.

## Uwagi wykonawcze

- nowe zależności wyłącznie z powodem i planem usunięcia w opisie
  commita (konstytucja §9); spodziewany komplet: astro, typescript,
  zod (w astro), vitest, linter — każda ponad to wymaga obrony;
- fonty self-hosted; zero zasobów z zewnętrznych CDN-ów;
- dwa raporty w opisie commita: `behavior_delta` i `hygiene_delta`;
- po zieleni koder aktualizuje `docs/CURRENT_STATE.md` (etap 0 → 1)
  w granicach `allowed_paths`.
