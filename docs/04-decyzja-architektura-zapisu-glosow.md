# 04 — Decyzja architektoniczna: zapis głosów użytkowników

Data: 2026-08-08 · Autor: architekt · Status: **obowiązuje z chwilą
zatwierdzenia kontraktu [`CHURCH-2`](05-kontrakt-CHURCH-2.md) przez
operatora**. Model głosów, bezpieczniki i warianty odrzucone:
[dokument 03](03-model-glosow-ocen-i-rankingu.md). Etap i następny krok:
[`CURRENT_STATE.md`](CURRENT_STATE.md).

## Kontekst

`CHURCH-1` wykonany: odczyt jest w pełni statyczny, fakty żyją w repo,
droga zapisu faktów to pull request. Dokument 03 zatwierdza kierunek
głosów (tekst, oceny 1–5 w pięciu wymiarach, ranking z progiem,
zdjęcia) i odsyła wybór technologii zapisu tutaj. Nierozstrzygnięte
decyzje operatora: domena, hosting, dostawca e-mail (sekcja BRAK).

## Decyzja 1 — cięcie zakresu

- **`CHURCH-2`**: głosy end-to-end **bez zdjęć** — konta z weryfikowanym
  e-mailem, przyjęcie głosu, moderacja, publikacja, agregaty, ranking
  z progiem. Jeden problem: „głos przechodzi bezpiecznie od autora do
  strony".
- **`CHURCH-3` (przyszły)**: zdjęcia w głosach. Wizerunek osób, EXIF
  i przechowywanie plików to osobna klasa ryzyka i kosztu — nie wchodzi
  do `CHURCH-2`.

## Decyzja 2 — publikacja przez repozytorium

Głos zatwierdzony w moderacji staje się **plikiem danych w repo**
(`src/dane/glosy/**`), tak jak fakty. Build liczy agregaty i zapieka je
w strony. Konsekwencje:

- ścieżka odczytu pozostaje statyczna — wirusowy skok obsługuje CDN,
  serwis zapisu może leżeć, a produkt dalej się czyta;
- każdy publiczny głos ma autora, diff i historię; usunięcie i rollback
  to operacje gitowe, jak przy faktach;
- „publikacja wyłącznie po moderacji" jest mechaniczna: do builda
  wchodzi tylko to, co moderator wyeksportował do repo.

## Decyzja 3 — serwis zapisu

Jeden mały serwis HTTP w TypeScript (Node ≥ 22), katalog `serwer/`:

- **Baza: `node:sqlite`** (wbudowana w Node) — konta, tokeny logowania,
  głosy oczekujące i odrzucone; zero natywnych zależności, jeden plik,
  kopia zapasowa = kopia pliku;
- **Konta: magic link** — e-mail z jednorazowym linkiem; kliknięcie jest
  weryfikacją; zero haseł (nie ma czego wykradać ani resetować); sesja
  jako cookie podpisane HMAC; publikowany wyłącznie pseudonim;
- **Wysyłka e-mail przez interfejs `DostawcaEmail`** — implementacja
  produkcyjna po decyzji operatora (BRAK), w testach mock systemu
  zewnętrznego;
- **Moderacja: minimalny panel operatora** (allowlist e-mail) — lista
  oczekujących, approve/reject z powodem; approve eksportuje plik głosu
  zgodny ze schematem; reject zapisuje powód i nic nie publikuje;
- **Droga usunięcia projektowana z drogą zapisu**: żądanie usunięcia
  konta kasuje rekordy w bazie i wskazuje pliki głosów do zdjęcia
  z repo; e-mail nigdy nie opuszcza bazy serwisu;
- **Framework HTTP: Hono** — mały router na standardzie fetch,
  przenośny między Node a środowiskami serverless, więc nie przesądza
  nierozstrzygniętego hostingu; plan usunięcia: API jest na tyle małe,
  że przepisanie na `node:http` to jedna sesja;
- sekrety (klucz HMAC, dostęp SMTP, token bota repo) wyłącznie
  w zmiennych środowiskowych.

## Warianty odrzucone

- **Supabase / Firebase / gotowe auth** — konta i dane osobowe
  u zewnętrznego dostawcy w produkcie, którego zasadą jest „prywatność
  domyślnie"; lock-in odrzucony już w dokumencie 01;
- **Postgres + ORM + własny serwer aplikacyjny** — koszt utrzymania
  i operacji nieobroniony przy jednej tabeli głosów na miasto;
- **hasła** — przechowywanie, wycieki i reset flow bez żadnej korzyści
  wobec magic linku, skoro e-mail i tak musi być zweryfikowany;
- **komentarze zewnętrzne (Disqus i podobne)** — reklamy, śledzenie,
  moderacja poza kontrolą — sprzeczne z doktryną co do joty;
- **publikacja głosów bezpośrednio z bazy (SSR)** — łamie tanią ścieżkę
  odczytu i czyni serwis pojedynczym punktem awarii produktu.

## BRAK — decyzje należące do operatora

1. `BRAK: dostawca e-mail` (SMTP/API) — bez niego magic link działa
   tylko w trybie deweloperskim; nie blokuje kodu (interfejs + mock).
2. `BRAK: hosting serwisu zapisu` — kod uruchamialny lokalnie; wybór
   miejsca wdrożenia razem z domeną.
3. `BRAK: domena` — przeniesiony z dokumentu 01; odblokowuje też
   `og:image` (DŁUG w pamięci operacyjnej).
