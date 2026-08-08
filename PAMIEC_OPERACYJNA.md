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

- 2026-08-08 koder: `CHURCH-1`–`CHURCH-3` wykonane na gałęzi
  `claude/church-rating-app-architecture-gnx6tr`; `npm run verify`
  zielone; czekają odbiory operatora i decyzja o pilotażu przy
  pokryciu 22,4% (`docs/CURRENT_STATE.md`).
- 2026-08-08 arch: zieleń `CHURCH-3` zweryfikowana niezależnie
  (119 testów, build 114 stron); akt „proceed" wpisany do `docs/08`.

## WĄTKI — otwarte, bez kontraktu

- 2026-08-08 arch: narzędzie analityki odwiedzin (diagnostyka `PB-002`)
  — decyzja operatora przed startem pilotażu Gdańska; `CHURCH-5`
  (zdjęcia) do napisania po wykonaniu `CHURCH-4` (`docs/09`).

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

- 2026-08-08 koder: oficjalne strony części parafii Torunia bywają
  niedostępne (katedratorun.pl — domena przejęta przez aukcję;
  katedrajanow.pl — pusty shell SPA; parafia-wnmp.pl — 503 po HTTPS,
  ale działa po zwykłym HTTP); katalog diecezja-torun.pl jest stabilny,
  lecz nie podaje spowiedzi, muzyki, wspólnot ani dostępności.
- 2026-08-08 koder: katalog diecezja.gda.pl nie publikuje godzin mszy;
  moduł `gpg-service` na stronach ISP to wolny tekst — parser czyta
  wyłącznie zamknięte warianty etykiet w `<strong>`; poszerzanie
  pokrycia = nowy zweryfikowany wariant etykiety + fixture, nigdy
  luźniejszy regex (błędne godziny mszy to realna szkoda).
- 2026-08-08 koder: podstrony „Msze" na ISP nie mają modułu
  `gpg-service` (ślepa uliczka); jadwigaorunia.gda.pl po południu
  serwowała anty-botową przejściówkę — pipeline'u nie uruchamiać
  w pętli, odstępy i pojedyncze przebiegi.

## DŁUG — DebtRecords czekające na kontrakt

- 2026-08-08 koder: obraz Open Graph (`og:image`) wymaga absolutnego
  URL, więc czeka na decyzję o domenie (`BRAK` w `docs/01`); strony
  mają tytuł i opis OG zgodnie z akceptacją 6 `CHURCH-1`.
- 2026-08-08 koder: pole `www` rekordu WNMP wskazuje
  `https://parafia-wnmp.pl` (503); działa wariant `http://` — zmiana
  poza listą poprawek z przeglądu, czeka na kontrakt/decyzję.
- 2026-08-08 koder: mianownik listy bazowej Gdańska bez innych wyznań —
  publiczne katalogi istnieją (luteranie.pl, orthodox.pl), ale bez
  jednoznacznej miejskiej listy w jednym kroku; do włączenia osobną
  iteracją pipeline'u (zapisane też w polu `pozaMianownikiem` listy).
