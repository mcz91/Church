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

- 2026-08-08 pm: PB-002 (zastępuje PB-001) na gałęzi
  `claude/church-rating-app-pm-ze7w6m`, niescalony; decyzje operatora
  w sekcji BRAK briefu.

## WĄTKI — otwarte, bez kontraktu

(pusto)

## DECYZJE Z CZATU — obowiązują, niezmechanizowane

- 2026-08-08 arch: repo startuje z czwórką ról `PROMPT_{PM,ARCHITEKT,
  KODER,AUDYTOR}.md` w korzeniu i kopią konstytucji Foundry; konwencja
  wspólna z `mcz91/foundry` i `mcz91/ezmat`, rozszerzona o PM.

## PUŁAPKI — koszt odkrycia > koszt linii

- Komendy weryfikacji jeszcze nie istnieją (etap 0) — kontrakt kodu,
  który ich nie ustanawia, jest niekompletny.

## DŁUG — DebtRecords czekające na kontrakt

(pusto)
