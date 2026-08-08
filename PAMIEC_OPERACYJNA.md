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

- 2026-08-08 arch: oceny użytkowników odłożone do osobnego kontraktu
  z moderacją; analityka metryki północnej — osobna decyzja operatora.

## DECYZJE Z CZATU — obowiązują, niezmechanizowane

- 2026-08-08 arch: repo startuje z czwórką ról `PROMPT_{PM,ARCHITEKT,
  KODER,AUDYTOR}.md` w korzeniu i kopią konstytucji Foundry; konwencja
  wspólna z `mcz91/foundry` i `mcz91/ezmat`, rozszerzona o PM.
- 2026-08-08 operator: „buduj; prosto, ale ślicznie; apka, która pozwoli
  znaleźć swoje miejsce" — akt kwalifikacji bez ProductBriefu PM-a;
  założenia zastępcze w `docs/01`, wiążą po zatwierdzeniu `CHURCH-1`.
- 2026-08-08 operator: kierunek wizualny bez estetyki dewocyjnej —
  złoto i ciężki granat odrzucone; obowiązują tokeny v2 z `docs/01`
  (świerkowa zieleń, bezszeryfy, zero symboliki religijnej w UI).

## PUŁAPKI — koszt odkrycia > koszt linii

- Komendy weryfikacji jeszcze nie istnieją (etap 0) — kontrakt kodu,
  który ich nie ustanawia, jest niekompletny.

## DŁUG — DebtRecords czekające na kontrakt

(pusto)
