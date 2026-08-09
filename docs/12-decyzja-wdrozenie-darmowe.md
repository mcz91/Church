# 12 — Decyzja wdrożeniowa: konfiguracja darmowa (post factum)

Data: 2026-08-09 · Autor: architekt · Status: **obowiązuje** —
dokumentacja post factum aktu operatora z 2026-08-08 („tak. wykonaj",
„działaj"; wymóg osobnego kontraktu dla tego zakresu jawnie uchylony
przez operatora, z zaproszeniem do doszycia dokumentu). Kroki
wymagające kont operatora: `README.md`, sekcja „Wdrożenie".

## Decyzje

1. **Statyka: Cloudflare Pages** (droga automatyczna przez token
   w sekretach GitHuba albo ręczna przez Connect to Git); do czasu
   domknięcia integracji build wchodzi uploadem ręcznym — witryna jest
   ONLINE pod subdomeną platformy (adres w `docs/CURRENT_STATE.md`).
2. **Odświeżanie danych: GitHub Actions** — codzienny workflow
   uruchamia `dane:odswiez` i otwiera pull request; recenzja PR
   pozostaje moderacją danych (dokument 07 bez zmian).
3. **E-mail: Brevo** (plan darmowy) przez interfejs `DostawcaEmail`
   z `CHURCH-2` — implementacja `DostawcaBrevo`; bez klucza API serwis
   loguje magic linki na konsolę (tryb deweloperski).
4. **Serwis zapisu: maszyna operatora** (Oracle Cloud Always Free albo
   własna za Cloudflare Tunnel), Node ≥ 22, `systemd`/`pm2`; kopia
   zapasowa = kopia pliku bazy i magazynu zdjęć.
5. **Domena: subdomena platformy tymczasowo** — własna domena pozostaje
   `BRAK` operatora i nadal blokuje `og:image` (DebtRecord w pamięci).

## Uzasadnienie i granice

Całość mieści się w planach darmowych i nie dodaje żadnej zależności
kodu od platform: statyka jest zwykłym katalogiem plików, serwis zwykłym
procesem Node, a jedyne sprzężenia (token Pages, klucz Brevo) żyją
w sekretach poza repo. Zmiana dowolnego dostawcy to decyzja operacyjna,
nie kod. Otwarte pozostają: własna domena, narzędzie analityki
odwiedzin (diagnostyka `PB-002`) i formalny start pilotażu.
