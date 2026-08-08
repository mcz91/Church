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

- 2026-08-08 koder: `CHURCH-1` wykonany + poprawki z przeglądu
  architekta (kontrast AA, podział osi tabeli, kopia startu, osie WNMP)
  na gałęzi `claude/church-rating-app-architecture-gnx6tr`; `npm run
  verify` zielone; katedra bez nowych osi — brak źródła (pkt 4 warunkowy);
  czeka odbiór operatora (ocena „ślicznie", `docs/02` akc. 7).
- 2026-08-08 arch: kontrakt `CHURCH-2` napisany (`docs/05`, architektura
  w `docs/04`) — pole zatwierdzenia puste, czeka na akt operatora.

## WĄTKI — otwarte, bez kontraktu

- 2026-08-08 arch: analityka metryki północnej — osobna decyzja
  operatora; zdjęcia w głosach wycięte do `CHURCH-3` (`docs/04`).

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

- 2026-08-08 koder: gałąź `claude/church-rating-app-pm-ze7w6m`
  (PB-001/PB-002, zatwierdzony Gdańsk) bazuje na bootstrapie sprzed
  `CHURCH-1` i równolegle edytuje `docs/CURRENT_STATE.md` oraz ten
  plik — integracja z gałęzią wykonania wymaga właściciela kolejności
  scalania (konstytucja §14).

- 2026-08-08 koder: oficjalne strony części parafii Torunia bywają
  niedostępne (katedratorun.pl — domena przejęta przez aukcję;
  katedrajanow.pl — pusty shell SPA; parafia-wnmp.pl — 503 po HTTPS,
  ale działa po zwykłym HTTP); katalog diecezja-torun.pl jest stabilny,
  lecz nie podaje spowiedzi, muzyki, wspólnot ani dostępności.

## DŁUG — DebtRecords czekające na kontrakt

- 2026-08-08 koder: obraz Open Graph (`og:image`) wymaga absolutnego
  URL, więc czeka na decyzję o domenie (`BRAK` w `docs/01`); strony
  mają tytuł i opis OG zgodnie z akceptacją 6 `CHURCH-1`.
- 2026-08-08 koder: pole `www` rekordu WNMP wskazuje
  `https://parafia-wnmp.pl` (503); działa wariant `http://` — zmiana
  poza listą poprawek z przeglądu, czeka na kontrakt/decyzję.
