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

- 2026-08-08 arch: `CHURCH-1` zatwierdzony (akt w `docs/02`); całość
  na gałęzi `claude/church-rating-app-architecture-gnx6tr`; następny
  ruch należy do kodera.

## WĄTKI — otwarte, bez kontraktu

- 2026-08-08 arch: `CHURCH-2` (głosy wg `docs/03`) do napisania po
  wykonaniu `CHURCH-1`; analityka metryki północnej — osobna decyzja
  operatora; miasto startowe nadal niewskazane.

## DECYZJE Z CZATU — obowiązują, niezmechanizowane

- 2026-08-08 arch: repo startuje z czwórką ról `PROMPT_{PM,ARCHITEKT,
  KODER,AUDYTOR}.md` w korzeniu i kopią konstytucji Foundry; konwencja
  wspólna z `mcz91/foundry` i `mcz91/ezmat`, rozszerzona o PM.
- 2026-08-08 operator (czat, kolejno): „buduj" bez ProductBriefu PM-a;
  estetyka niedewocyjna → „poetycko piękne" → rozbudowa opinii →
  zatwierdzenie CHURCH-1 z odrzuceniem fontu — wszystko utrwalone
  w `docs/01`–`03`; makiety v1–v6 żyły w artefakcie czatu, wzorcem
  wykonawczym jest opis tokenów w `docs/01`, nie plik makiety.

## PUŁAPKI — koszt odkrycia > koszt linii

- Komendy weryfikacji jeszcze nie istnieją (etap 0) — kontrakt kodu,
  który ich nie ustanawia, jest niekompletny.

## DŁUG — DebtRecords czekające na kontrakt

(pusto)
