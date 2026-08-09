# 10 — Kontrakt CHURCH-5

Wersja: 1 · Data: 2026-08-08 · Autor: architekt · Typ: feature
(nowe zachowanie — nowe testy muszą być czerwone przed implementacją;
suity `CHURCH-1`–`CHURCH-4` to preservation: pełna zieleń przed i po).

**Zatwierdzenie operatora:** zatwierdzony aktem operatora z 2026-08-08
(czat) — akt odnotowany przez kodera w pamięci operacyjnej przy
podjęciu wykonania; wpis uzupełnił architekt, bo dla kodera ten plik
jest tylko do odczytu. Kontrakt jest od tej chwili niemutowalny.

Model produktowy zdjęć:
[dokument 03](03-model-glosow-ocen-i-rankingu.md) — zdjęcia pokazują
**miejsce, nie ludzi**; zdjęcie z rozpoznawalnymi osobami odpada
w moderacji; EXIF (w tym geolokalizacja i dane urządzenia) usuwany przy
przyjęciu. Architektura zapisu i zasada „automat nigdy nie publikuje":
dokumenty [04](04-decyzja-architektura-zapisu-glosow.md)
i [07](07-decyzja-automatyzacja-faktow-i-wstepnej-moderacji.md).

## Decyzje techniczne tego kontraktu

- **Formaty: wyłącznie JPEG i PNG**, limit rozmiaru pliku 8 MB
  i limit dłuższego boku czytany z nagłówków obrazu (bez dekodowania
  pikseli); HEIC i konwersje formatów poza zakresem — wymagałyby
  natywnych zależności bez obrony na tę skalę;
- **usuwanie metadanych bez zależności**: JPEG — usunięcie segmentów
  aplikacyjnych APP1–APP15 i komentarzy przy zachowaniu strumienia
  obrazu; PNG — usunięcie chunków `eXIf`, `tEXt`, `iTXt`, `zTXt`;
  deterministyczna reserializacja, zero bibliotek natywnych;
- **przechowywanie**: zdjęcia oczekujące żyją w magazynie serwisu obok
  bazy; zdjęcia opublikowane wchodzą do repo obok plików głosów
  (publikacja przez repo jak wszystko) — miniatur i przetwarzania
  obrazu nie ma; przy realnym wolumenie wróci jako osobna decyzja
  (`DebtRecord` w pamięci po wykonaniu).

## goal

Autor głosu może pokazać miejsce, o którym mówi — zdjęciem z podpisem,
które przechodzi tę samą ludzką moderację co słowa i niczego nie
zdradza o autorze ponad to, co sam podpisał.

## acceptance

1. `npm run verify` pozostaje bramką i jest zielone; `README.md`
   opisuje przyjmowanie zdjęć.
2. Schemat głosu rozszerzony o opcjonalną listę zdjęć (plik, podpis,
   tekst alternatywny — wymagany, opisujący miejsce); głos `approved`
   ze zdjęciem wskazującym plik nieistniejący w repo nie przechodzi
   walidacji builda (przypadek czerwony); suita `CHURCH-2` bez zdjęć
   przechodzi bez zmian (zdjęcia są opcjonalne).
3. Serwis przyjmuje zdjęcie wyłącznie razem z głosem od zweryfikowanego
   konta: JPEG/PNG do 8 MB; inny format lub rozmiar — odrzucenie
   z powodem (przypadki czerwone); zapis w magazynie następuje przed
   odpowiedzią serwisu.
4. Metadane usuwane przy przyjęciu, przed zapisem do magazynu: test
   z fixture'em JPEG zawierającym EXIF z geolokalizacją dowodzi, że
   plik w magazynie nie zawiera żadnego segmentu APP ani komentarza;
   analogiczny test dla PNG z chunkiem `eXIf`/`tEXt`; strumień obrazu
   pozostaje bajtowo nienaruszony.
5. Publikacja wyłącznie drogą approve człowieka: eksport głosu kopiuje
   zdjęcia z magazynu do repo obok pliku głosu; test asercyjny — żadna
   inna ścieżka serwisu nie tworzy plików obrazów w katalogach
   publikowanych; reject usuwa zdjęcia z magazynu trwale.
6. Panel moderacji pokazuje zdjęcia oczekujące przy głosie wraz
   z zasadą z dokumentu 03 („miejsce, nie ludzie; rozpoznawalne osoby
   — odrzucenie") i podpisem autora; moderator może odrzucić sam głos
   lub same zdjęcia (głos bez zdjęć zostaje w kolejce jako głos bez
   zdjęć) — testy obu dróg.
7. Usunięcie konta obejmuje zdjęcia: magazyn czyszczony, a lista
   plików autora do usunięcia z repo zawiera także pliki obrazów;
   test dowodzi, że po usunięciu eksport autora nie zawiera żadnych
   plików.
8. Galeria profilu wg makiety v6: zdjęcia opublikowanych głosów
   w proporcji 4:3, promień 7 px, podpis „fot. <pseudonim>" na
   gradiencie; `<img>` z wymaganym `alt`; sekcja nie renderuje się,
   gdy zdjęć nie ma; formularz głosu (`/glos/<slug>`) przyjmuje pliki
   zwykłym POST multipart i działa bez JavaScriptu — test builda na
   fixture'ach jawnie fikcyjnych.
9. Adres e-mail, nazwa pliku źródłowego i jakiekolwiek metadane
   urządzenia nie występują w wyjściu publicznym: nazwy plików w repo
   są pochodną identyfikatora głosu, nie oryginalnej nazwy — test
   asercyjny.
10. Suity `CHURCH-1`–`CHURCH-4` zielone przed i po; bezpieczniki bez
    zmian; ocena estetyczna galerii („ślicznie") należy do operatora
    przy odbiorze.

## non_goals

- miniatury, kadrowanie, konwersje, `srcset` i CDN obrazów — osobna
  decyzja przy realnym wolumenie;
- HEIC/HEIF i wideo;
- automatyczne wykrywanie twarzy — o „miejsce, nie ludzie" rozstrzyga
  człowiek w moderacji;
- zdjęcia poza głosami (galerie parafii bez autora — sprzeczne
  z zasadą autorstwa);
- publiczny start pilotażu i BRAK-i operatora (e-mail, hosting/CI,
  domena, analityka);
- miasta poza Toruniem i Gdańskiem.

## allowed_paths

```
src/**
public/**
tests/**
serwer/**
narzedzia/**
package.json
package-lock.json
astro.config.*
tsconfig.json
.gitignore
README.md
docs/CURRENT_STATE.md
```

`CONSTITUTION.md`, `PROMPT_*.md`, `docs/01-…` – `docs/10-…`,
`docs/briefs/**` — tylko do odczytu. `PAMIEC_OPERACYJNA.md` —
wyłącznie zgodnie z jej protokołem.

## verification

```bash
npm ci
npm run verify
```

Czerwień lub brak = brak dowodu; deklaracja nie jest dowodem.

## Uwagi wykonawcze

- fixture'y obrazów: wygenerowane programowo, jawnie fikcyjne
  (jednolite kolory / proste wzory), z syntetycznie dodanym EXIF —
  żadnych realnych fotografii i realnych współrzędnych w repo;
- zero nowych zależności w ścieżce obrazu — parsowanie segmentów JPEG
  i chunków PNG jest częścią kontraktu; każda inna zależność wymaga
  obrony w opisie commita;
- dwa raporty w opisie commita: `behavior_delta` i `hygiene_delta`;
- po zieleni koder aktualizuje `docs/CURRENT_STATE.md` (etap 4 → 5)
  w granicach `allowed_paths`.
