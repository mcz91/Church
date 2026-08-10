# Church

Church to porównywarka kościołów: produkt, który pozwala znaleźć, porównać
i udostępnić informacje o kościołach i wspólnotach — z ambicją wirusowości
opartą na wartości dla użytkownika, nigdy na kpinie czy konflikcie.

Repozytorium jest pod kontrolą Foundry (`mcz91/foundry`). Obowiązuje
[`CONSTITUTION.md`](CONSTITUTION.md).

**Bieżący etap, ograniczenia i następny krok:**
[`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md).

## Bramka repozytorium

Komplet komend weryfikacji — wszystkie muszą być zielone przed
zamknięciem każdej zmiany:

```bash
npm ci
npm run verify
```

`npm run verify` wykonuje kolejno:

1. `npm run lint` — ESLint na plikach TypeScriptu;
2. `npm run check` — `astro check` (typy stron i kolekcji);
3. `npm run test` — testy Vitest: jednostkowe (schematy danych i głosów,
   agregaty, ranking, kanoniczny adres porównania) i integracyjne
   (serwis zapisu na bazie w pamięci, build na danych fikcyjnych);
4. `npm run build` — pełny statyczny build Astro.

Podgląd lokalny: `npm run dev`.

Adres publiczny: **https://koscioly.pages.dev** (wybór operatora,
czat 2026-08-10; projekt Cloudflare Pages o nazwie `koscioly`). Build
czyta go ze zmiennej `SITE_URL`
(`SITE_URL=https://koscioly.pages.dev npm run build`). Dopiero z nim strony
emitują `og:url`, absolutny `og:image` (profil — wizytówka parafii,
porównanie — wizytówka pierwszej alfabetycznie parafii pary) oraz
`sitemap.xml` i `robots.txt`. Bez `SITE_URL` build przechodzi i po
prostu ich nie ma: lepiej bez podglądu niż z adresem zmyślonym.
Zmienna `PUBLIC_ZAPIS_URL` wskazuje publiczny adres serwisu zapisu.

Struktura adresów: start jest bramą z kartami miast, `/<miasto>`
(np. `/torun`) daje listę parafii z rankingiem i zawężaniem, a
`/<miasto>/<filtr>` (np. `/torun/msza-z-dziecmi`) to statyczna strona
faktu — powstaje wyłącznie dla osi, dla której w mieście jest choć
jedna parafia z danymi. Slugi filtrów pochodzą z zamkniętej mapy
w [`src/lib/filtry.ts`](src/lib/filtry.ts), nie z etykiet, więc zmiana
napisu nie psuje cudzych linków.

Zawężanie listy miasta jest **dodatkiem** — siedzi zwinięte pod listą
parafii i rozwija się na żądanie: pora („msza niedługo": 30 minut,
godzina, 2 godziny) i cechy z faktów (msza z udziałem dzieci, msza dla
młodzieży, spowiedź poza mszą). Godziny do wyszukiwarki wydobywa [`src/lib/msze.ts`](src/lib/msze.ts) z zapisu
porządku mszy i **bierze wyłącznie pozycje pewne** — dopisek sezonowy,
inny dzień albo zdanie negujące („w wakacje nie ma Mszy o 12:00")
unieważniają godzinę, więc parafia po prostu nie pojawia się w wynikach
zamiast pokazać godzinę zgadniętą. Panel jest ukryty w HTML i odsłania
go dopiero skrypt: bez JavaScriptu nie ma martwych kontrolek, a pełna
lista parafii jest w dokumencie zawsze.

Mapka na karcie parafii składa się z czterech kafelków OpenStreetMap
leżących w repo (`public/mapki/`), a ujemne marginesy ustawiają punkt
parafii na środku kadru — bez skryptu i bez zasobu z obcej domeny.

**Bez działającego serwisu zapisu formularze nic nie zapiszą.** Strony
są statyczne, a adres serwisu wchodzi do nich przy buildzie ze zmiennej
`PUBLIC_ZAPIS_URL`; gdy jej nie ma, w HTML ląduje deweloperskie
`http://localhost:8788`, czyli maszyna odwiedzającego — przeglądarka
nie ma z czym rozmawiać. Publiczny build wymaga więc jednego i drugiego:
uruchomionego serwisu pod publicznym adresem i `PUBLIC_ZAPIS_URL`
wskazującego ten adres.

Serwis zapisu głosów (deweloperski): `npm run serwis` — wymaga zmiennych
środowiskowych z [`serwer/.env.example`](serwer/.env.example); magic linki
trafiają na konsolę, dopóki dostawca e-mail nie jest rozstrzygnięty.

Droga głosu jest jednoprzebiegowa: na stronie `/glos/<parafia>` gość
wypełnia oceny, tekst, pseudonim i adres w **jednym** formularzu, a link
potwierdzający dostaje dopiero po wysłaniu — pisanie nie wymaga wcześniejszej
wizyty w skrzynce. Doktryna [dokumentu 03](docs/03-model-glosow-ocen-i-rankingu.md)
zostaje: głos od niepotwierdzonego adresu jest zapisany jako `pending`,
ale moderator **nie może go przyjąć** (409), więc publikacja nadal wymaga
autora ze zweryfikowanym adresem i zgody człowieka.

Zdjęcia w głosach: formularz głosu przyjmuje do trzech zdjęć (JPEG/PNG,
do 8 MB, tekst alternatywny wymagany) zwykłym POST multipart; metadane
(EXIF, geolokalizacja, dane urządzenia) są usuwane przed zapisem do
magazynu (`serwer/magazyn/`, poza repo); publikacja wyłącznie drogą
approve moderatora — zdjęcia wchodzą wtedy do repo obok pliku głosu,
pod nazwą pochodną identyfikatora, nigdy oryginalną.

Pipeline danych Gdańska (sieć wyłącznie przy generowaniu danych — testy
chodzą na zarchiwizowanych fixture'ach):

1. `npm run dane:pozyskaj` — katalog archidiecezji gdańskiej + strony
   parafii o jednoznacznej strukturze → `src/dane/parafie/gdansk/`,
   lista bazowa i raport wyjątków;
2. `npm run dane:odswiez` — porównuje źródła ze stanem repo; zmiana
   wartości daje diff z nową datą odczytu, brak zmiany nie daje niczego;
3. `npm run dane:pokrycie` — raport pokrycia listy bazowej
   ([`src/dane/raporty/gdansk-pokrycie.md`](src/dane/raporty/gdansk-pokrycie.md));
4. `npm run dane:silniki` — klasyfikacja stron z braków po silniku
   (sygnatury w HTML) do `src/dane/raporty/gdansk-silniki.json`;
5. `npm run dane:kolejka` — kolejka wyjątków ręcznych: podgląd
   deterministycznych kandydatów (bez zapisu); zapis wyłącznie
   z plikiem potwierdzeń człowieka, po weryfikacji każdej godziny
   przeciw treści strony źródłowej
   (`npm run dane:kolejka -- potwierdzenia.json`);
6. `npm run dane:mapki` — położenie parafii z OpenStreetMap
   (Nominatim, ODbL) i cztery kafelki mapy na parafię do
   `public/mapki/`. Przyjmowane jest wyłącznie trafienie typu „miejsce
   kultu" w granicach Polski — adres pasujący do sąsiedniego budynku
   odpada, a parafia zostaje bez mapki. Raport:
   [`src/dane/raporty/mapki.md`](src/dane/raporty/mapki.md);
7. `npm run dane:wizytowki` — dobór zdjęcia-wizytówki budynku
   (jedno na parafię, wyłącznie Wikimedia Commons, licencje z zamkniętej
   listy wolnych): bez argumentu pokazuje kandydatów z API razem
   z autorem i licencją z `extmetadata` (bez zapisu); zapis wyłącznie
   z plikiem potwierdzeń człowieka, że to właściwy kościół
   (`npm run dane:wizytowki -- potwierdzenia.json`) — render ≤1600 px
   trafia do `public/wizytowki/`, metadane do rekordu parafii, raport
   doboru i braków do
   [`src/dane/raporty/wizytowki.md`](src/dane/raporty/wizytowki.md).

## Wdrożenie (konfiguracja darmowa — akt operatora 2026-08-08)

1. **Statyka — Cloudflare Pages**, dwie równoważne drogi:
   (a) automatyczna — wygeneruj w Cloudflare token API o zakresie
   „Cloudflare Pages: Edit", wpisz `CLOUDFLARE_API_TOKEN`
   i `CLOUDFLARE_ACCOUNT_ID` w GitHub → Settings → Secrets, a workflow
   [`deploy-pages.yml`](.github/workflows/deploy-pages.yml) zweryfikuje
   bramkę i opublikuje build przy każdym pushu do gałęzi domyślnej;
   (b) ręczna — połącz repozytorium w panelu Cloudflare (Connect to
   Git; build `npm ci && npm run build`, katalog `dist`). W obu drogach
   zmienna `PUBLIC_ZAPIS_URL` wskazuje publiczny adres serwisu zapisu.
   Projekt Pages nazywa się `koscioly`, więc witryna stoi pod
   `https://koscioly.pages.dev`. W GitHub → Settings → Variables
   ustaw `SITE_URL` na ten adres, żeby workflow budował z podglądami
   i sitemapą. Własna domena (`.pl`) pozostaje osobną, płatną decyzją.
2. **Odświeżanie danych — GitHub Actions**: workflow
   [`odswiez-dane.yml`](.github/workflows/odswiez-dane.yml) raz dziennie
   uruchamia `dane:odswiez` i otwiera pull request ze zmianami — jego
   recenzja jest moderacją danych.
3. **Serwis zapisu — maszyna z Node ≥ 22** (Oracle Cloud Always Free
   albo własna z Cloudflare Tunnel): sklonuj repo, `npm ci`, uzupełnij
   zmienne z [`serwer/.env.example`](serwer/.env.example)
   (`SEKRET_SESJI`, `MODERATORZY`, `BREVO_API_KEY`, `NADAWCA_EMAIL`,
   `BAZOWY_URL`) i uruchom `npm run serwis` pod nadzorem systemd/pm2.
   Baza i magazyn zdjęć żyją na dysku maszyny — kopia zapasowa = kopia
   plików `serwer/dane.db` i `serwer/magazyn/`.
4. **E-mail — Brevo** (plan darmowy, 300/dzień): załóż konto, zweryfikuj
   adres nadawcy, wygeneruj klucz API i podaj go serwisowi w env —
   bez klucza serwis loguje magic linki na konsolę (tryb deweloperski).

## Najważniejsza zasada produktu

> Każdy fakt o kościele ma źródło, każda ocena ma autora, a wirusowość
> nigdy nie powstaje kosztem prawdy ani godności żadnej wspólnoty.

## Role

Sesje LLM inicjalizują prompty w korzeniu repozytorium:

1. [`PROMPT_PM.md`](PROMPT_PM.md) — product manager: hipotezy, metryki,
   pętla wirusowa, wrażliwość tematu;
2. [`PROMPT_ARCHITEKT.md`](PROMPT_ARCHITEKT.md) — architekt: kwalifikacja
   „czy budować", kontrakty `CHURCH-N`, prostota i prawda danych;
3. [`PROMPT_KODER.md`](PROMPT_KODER.md) — wykonawca: jeden kontrakt,
   minimalny diff, testy, higiena;
4. [`PROMPT_AUDYTOR.md`](PROMPT_AUDYTOR.md) — niezależny audytor: findingi
   z dowodami, zero szumu.

Stan między sesjami ról przenosi
[`PAMIEC_OPERACYJNA.md`](PAMIEC_OPERACYJNA.md).

## Zacznij tutaj

1. [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) — status i granice;
2. [`CONSTITUTION.md`](CONSTITUTION.md) — konstytucja wykonawców;
3. prompt roli, w której działasz.
