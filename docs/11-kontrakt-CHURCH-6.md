# 11 — Kontrakt CHURCH-6

Wersja: 1 · Data: 2026-08-08 · Autor: architekt · Typ: feature
(nowe zachowanie — nowe testy muszą być czerwone przed implementacją;
suity `CHURCH-1`–`CHURCH-4` to preservation: pełna zieleń przed i po).

**Zatwierdzenie operatora:** _niewypełnione — kontrakt staje się
wykonywalny wyłącznie po jawnym akcie operatora._

Żądanie operatora (czat 2026-08-08): „dodaj zdjęcia kościołów, niech
będzie ślicznie". Kwalifikacja architekta: **zbuduj** — zdjęcie
budynku to najtańszy skok „ślicznie" i użyteczności karty (rozpoznanie
miejsca). Nie mylić z [`CHURCH-5`](10-kontrakt-CHURCH-5.md) (zdjęcia
od użytkowników przy głosach) — ten kontrakt dotyczy **jednego
zdjęcia-wizytówki budynku na parafię**, dobieranego redakcyjnie.

## Decyzje techniczne tego kontraktu

- **Źródło wyłącznie Wikimedia Commons.** Zdjęcia ze stron parafii
  odpadają: brak licencji na republikację. Commons daje wolne licencje
  i metadane autor/licencja przez API — atrybucja jest faktem ze
  źródłem, jak wszystko w tym produkcie.
- **Zamknięta lista licencji:** domena publiczna / CC0 / CC BY /
  CC BY-SA (dowolna wersja). Licencje NC i ND nie przechodzą schematu.
- **Człowiek potwierdza dopasowanie.** Automat wyszukuje kandydatów po
  nazwie parafii i mieście, ale to człowiek potwierdza, że zdjęcie
  przedstawia właściwy kościół — pomyłka budynku to szkoda dokładnie
  tej klasy, co błędne godziny mszy. Zasada kolejki z dokumentu 07:
  zapis wyłącznie po jawnym potwierdzeniu.
- **Self-host bez przetwarzania.** Pipeline pobiera jednorazowo gotowy
  render z Commons (szerokość ≤ 1600 px) i zapisuje do repo pod nazwą
  pochodną sluga parafii; w runtime zero zasobów z zewnętrznych domen
  (doktryna zero-CDN bez zmian); własnego skalowania obrazu nie ma.
- Po rozstrzygnięciu domeny (`BRAK` w `docs/01`) zdjęcie-wizytówka
  stanie się `og:image` profilu — dopisane do DebtRecord, poza tym
  kontraktem.

## goal

Karta parafii pokazuje od progu, jak wygląda to miejsce — legalnym
zdjęciem z widocznym autorem i licencją — i jest przez to piękniejsza
i bardziej rozpoznawalna przy udostępnianiu.

## acceptance

1. `npm run verify` pozostaje bramką i jest zielone; `README.md`
   opisuje komendę doboru zdjęć.
2. Schemat parafii rozszerzony o opcjonalne `zdjecie`: plik, wymagany
   tekst alternatywny, autor, licencja z zamkniętej listy wolnych,
   URL strony pliku w Commons, data pobrania; zdjęcie bez autora,
   bez licencji albo z licencją spoza listy jest odrzucane (przypadki
   czerwone); rekord ze zdjęciem wskazującym nieistniejący plik nie
   przechodzi testu danych.
3. Kolejka doboru: komenda wyszukuje kandydatów przez API Commons
   (nazwa parafii + miasto), pokazuje podgląd i metadane (autor,
   licencja — pobrane z API, nie przepisane ręcznie); zapis pliku
   i rekordu następuje wyłącznie po jawnym potwierdzeniu człowieka,
   że to właściwy kościół; tryb nieinteraktywny niczego nie zapisuje
   (test); testy na zarchiwizowanych odpowiedziach API i obrazach
   syntetycznych — sieć wyłącznie przy generowaniu danych,
   z odstępami (pułapka anty-botowa obowiązuje).
4. Profil: zdjęcie u góry arkusza (proporcja 3:2, promień zgodny
   z arkuszem, `<img>` z `alt`), pod nim dyskretna atrybucja:
   „fot. <autor> · <licencja> · Wikimedia Commons" z linkiem do strony
   pliku; parafia bez zdjęcia renderuje arkusz dokładnie jak dotąd.
5. Lista na stronie startowej: miniatura przy wierszu parafii ze
   zdjęciem; wiersze bez zdjęcia trzymają układ; brak poziomego
   przewijania na szerokości mobilnej.
6. Dane realne wchodzą tym kontraktem: wizytówki dla wszystkich trzech
   parafii Torunia oraz wszystkich parafii Gdańska, dla których
   w Commons istnieje zdjęcie na wolnej licencji jednoznacznie
   przedstawiające ten kościół; raport w repo wylicza, które parafie
   mają zdjęcie, a które nie i dlaczego (brak zdjęcia w Commons /
   licencja poza listą / brak pewności dopasowania — bez zgadywania).
7. Suity `CHURCH-1`–`CHURCH-4` zielone przed i po; strony czytelne bez
   JavaScriptu; tokeny dokumentu 01 bez zmian; ocenę „ślicznie" wydaje
   operator przy odbiorze.

## non_goals

- zdjęcia od użytkowników przy głosach — to `CHURCH-5`;
- galerie wielozdjęciowe budynku — jedno zdjęcie-wizytówka na parafię;
- własne skalowanie, kadrowanie, `srcset`, CDN obrazów;
- zdjęcia wnętrz wymagające oceny wizerunkowej osób — wizytówka ma
  pokazywać budynek/miejsce;
- pobieranie czegokolwiek ze stron parafii;
- publiczny start pilotażu i BRAK-i operatora.

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

`CONSTITUTION.md`, `PROMPT_*.md`, `docs/01-…` – `docs/11-…`,
`docs/briefs/**` — tylko do odczytu. `PAMIEC_OPERACYJNA.md` —
wyłącznie zgodnie z jej protokołem.

## verification

```bash
npm ci
npm run verify
```

Czerwień lub brak = brak dowodu; deklaracja nie jest dowodem.

## Uwagi wykonawcze

- kolejność wykonania względem `CHURCH-5` ustala akt operatora;
  kontrakty nie mogą iść równolegle (wspólne pliki, konstytucja §14);
- atrybucję (autor, licencja) czytaj z `extmetadata` API Commons;
  gdy pola brak — kandydat odpada, nie zgaduj;
- pliki obrazów w repo: rozsądny rozmiar (render ≤ 1600 px szerokości,
  format źródłowy JPEG/PNG/WebP wg Commons); żadnych nowych zależności
  bez obrony;
- dwa raporty w opisie commita: `behavior_delta` i `hygiene_delta`;
- po zieleni koder aktualizuje `docs/CURRENT_STATE.md`
  w granicach `allowed_paths`.
