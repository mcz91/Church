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

- 2026-08-10 koder: witryna ONLINE wraz z wizytówkami `CHURCH-6` —
  curly-recipe-bde5.dontfolditpl.workers.dev, sprawdzone z zewnątrz
  2026-08-10 (26 miniatur na starcie, obrazy 200); każda aktualizacja
  wymaga nowej paczki, dopóki operator nie domknie integracji
  Git/tokenu; formularze głosów czekają na serwis zapisu (etap B).
- 2026-08-10 arch: zieleń `CHURCH-6` zweryfikowana niezależnie
  (182 testy); przegląd „wow, ale subtelnie" wykonany na zrzutach
  żywego buildu — projekt w kontrakcie `CHURCH-7` (`docs/13`), czeka
  na akt operatora.

## WĄTKI — otwarte, bez kontraktu

- 2026-08-08 arch: narzędzie analityki odwiedzin (diagnostyka `PB-002`)
  — decyzja operatora przed startem pilotażu Gdańska.

## DECYZJE Z CZATU — obowiązują, niezmechanizowane

- 2026-08-09 operator: akt „zatwierdz" dla `CHURCH-6` padł w czacie;
  pole zatwierdzenia w `docs/11` wciąż „niewypełnione" — uzupełnia
  architekt (koder ma zakaz zapisu `docs/11`); akt odnotowany też
  w commicie wykonawczym.
- 2026-08-10 operator: „proceed" po sprzeciwie kodera = zgoda na część
  żądania („msza niedługo" + filtry) bez kontraktu; reszta (odległość,
  mapka, wymiary `kazanie`/znaczniki) czeka na architekta — propozycja
  kryteriów padła wyłącznie w czacie, repo jej nie zna.
- 2026-08-08 operator: BRAK-i wdrożeniowe rozstrzygnięte aktem („tak.
  wykonaj" + „działaj"): konfiguracja darmowa, szczegóły delegowane na
  kodera (Cloudflare Pages, GitHub Actions, Brevo, VM/tunel, subdomena);
  wymóg kontraktu dla tego zakresu uchylony — architekt może doszyć
  dokument post factum; kroki kontowe operatora: README „Wdrożenie".
- 2026-08-08 operator: makiety v1–v6 żyły wyłącznie w artefakcie czatu —
  wzorcem wykonawczym jest opis tokenów w `docs/01`, nie plik makiety.

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
- 2026-08-08 koder: pipeline uruchamiać pojedynczo z odstępami —
  strony parafii bywają za anty-botem (jadwigaorunia), a katalog
  diecezji po wielu odsłonach dziennie bywa niestabilny (chwilowo
  nieczytelne karty nie kasują istniejących danych, ale raport
  silników z takiego dnia zawyża „brak-www"); podstrony „Msze" na ISP
  nie mają modułu gpg-service (ślepa uliczka).

## DŁUG — DebtRecords czekające na kontrakt

- 2026-08-08 koder: zdjęcia bez miniatur, kadrowania i `srcset`
  (`docs/10`) — wraca jako decyzja przy realnym wolumenie obrazów.
- 2026-08-08 koder: `og:image` wymaga absolutnego URL — `CHURCH-7`
  akc. 5 rozwiązuje to przez `SITE_URL`, dopóki nie ma domeny.
- 2026-08-08 koder: mianownik listy bazowej Gdańska bez innych wyznań —
  sprawdzone 2026-08-08 (docs/09 acc. 7): luteranie.pl/parafie to
  wyszukiwarka-mapa bez statycznej listy miejskiej, bg.cerkiew.pl nie
  odpowiada; dług zostaje do zmiany po stronie katalogów albo decyzji
  o innym źródle (zapisane też w polu `pozaMianownikiem` listy).
