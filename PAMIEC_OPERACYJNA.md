# Pamięć operacyjna ról Church

Nośnik stanu między sesjami czatu ról (PM / architekt / koder / audytor).
Nie jest źródłem statusu produktu — to wyłącznie `docs/CURRENT_STATE.md`.
Tu wyłącznie to, czego repo nie wie. Kopia faktu dostępnego w repo jest
błędem; linkuj.

Protokół (koszt czytelnika > koszt pisarza):

- czytaj na starcie sesji; nadpisz swoje wpisy przed zamknięciem;
- limit pliku: 80 linii; nowy wpis wchodzi kosztem najsłabszego;
- format wpisu: `RRRR-MM-DD rola: fakt` — telegraficznie, bez narracji;
- fakt utrwalony w repo (dokument, test, kontrakt) → usuń wpis;
- zero śladów dialogu, zero „w trakcie" bez wskazania gałęzi/pliku;
- audytor czyta i pisze wyłącznie PUŁAPKI (świeżość kontekstu).

## STAN — praca w locie

- 2026-08-08 arch: `CHURCH-1` + decyzja 01 na gałęzi
  `claude/church-rating-app-architecture-gnx6tr`; czeka wyłącznie na
  akt zatwierdzenia operatora (pole w `docs/02-kontrakt-CHURCH-1.md`).

## WĄTKI — otwarte, bez kontraktu

- 2026-08-08 arch: `CHURCH-2` (głosy wg `docs/03`) do napisania po
  wykonaniu `CHURCH-1`; analityka metryki północnej — osobna decyzja
  operatora; miasto startowe nadal niewskazane.

## DECYZJE Z CZATU — obowiązują, niezmechanizowane

- 2026-08-08 arch: repo startuje z czwórką ról `PROMPT_{PM,ARCHITEKT,
  KODER,AUDYTOR}.md` w korzeniu i kopią konstytucji Foundry; konwencja
  wspólna z `mcz91/foundry` i `mcz91/ezmat`, rozszerzona o PM.
- 2026-08-08 operator (czat, kolejno): „buduj" bez ProductBriefu PM-a;
  estetyka niedewocyjna, potem „poetycko piękne, nie krzykliwe";
  „fajne!" dla makiety v3; rozbudowa opinii o punkty, ranking
  i zdjęcia — utrwalone w `docs/01` i `docs/03`; poza repo zostaje
  tylko fakt, że akty padły w czacie, bez formalnego zatwierdzenia
  pola w `docs/02`.

## PUŁAPKI — koszt odkrycia > koszt linii

- Komendy weryfikacji jeszcze nie istnieją (etap 0) — kontrakt kodu,
  który ich nie ustanawia, jest niekompletny.

## DŁUG — DebtRecords czekające na kontrakt

(pusto)
