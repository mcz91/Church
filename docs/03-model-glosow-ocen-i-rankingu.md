# 03 — Decyzja architektoniczna: głosy, oceny punktowe, ranking, zdjęcia

Data: 2026-08-08 · Autor: architekt · Status: **kierunek zatwierdzony
przez operatora w czacie; wiąże wykonawczo dopiero jako kontrakt
`CHURCH-2`** (do napisania po zatwierdzeniu i wykonaniu
[`CHURCH-1`](02-kontrakt-CHURCH-1.md)). Wzorzec wizualny: makieta v4.

## Kontekst

Operator 2026-08-08 zażądał rozbudowy opinii: oceny tekstowe
i punktowe, ranking, opcja zdjęć. Doktryna repo zakazuje osi
„lepszości" wyznania i rankingu religii; ranking **parafii** z ocen
doświadczenia jest dopuszczalny wyłącznie z bezpiecznikami poniżej —
bez nich zestawienie mieszające wyznania stałoby się rankingiem religii
i wirusowością na konflikcie.

## Decyzja

**Głos** = jedna wypowiedź jednego autora o jednej parafii:

- tekst (opcjonalny, moderowany) — forma cytatu jak w makiecie;
- ocena ogólna 1–5 oraz oceny w **pięciu zamkniętych wymiarach
  doświadczenia**: przyjęcie, muzyka, z dziećmi, dostępność,
  organizacja; wymiary oceniają doświadczenie odwiedzającego, nigdy
  wiarę, doktrynę ani wspólnotę jako ludzi;
- zdjęcia (opcjonalne): pokazują **miejsce, nie ludzi** — zdjęcie
  z rozpoznawalnymi osobami odpada w moderacji; EXIF (w tym
  geolokalizacja i dane urządzenia) usuwany przy przyjęciu;
- autor: konto z weryfikowanym e-mailem, publikowany pseudonim;
  e-mail nigdy niepubliczny; droga usunięcia konta i głosów
  projektowana razem z drogą zapisu;
- publikacja wyłącznie po moderacji (status `approved`); do tego czasu
  głos nie istnieje publicznie.

**Agregaty:** średnia ogólna i średnie wymiarów, zawsze z liczbą
głosów. **Ranking miejski:** kolejność wyłącznie ze średniej ogólnej;
próg wejścia **≥ 5 głosów** (poniżej: „za mało głosów", nigdy pozycja);
remisy dzielone. Sortowanie alternatywne tylko po osiach faktów.

## Bezpieczniki (twarde, mechanizowane w CHURCH-2)

1. **Zero agregacji po wyznaniu.** Żaden widok, API ani eksport nie
   liczy średnich per wyznanie — test asercyjny, nie konwencja.
2. Wymiary ocen są typem zamkniętym; dodanie wymiaru = nowa wersja
   dokumentu 03, nie edycja danych.
3. Ranking bez progu głosów nie renderuje się wcale (fail-closed).
4. Głos bez autora lub bez statusu moderacji nie przechodzi walidacji —
   analogia reguły „fakt bez źródła nie wchodzi".
5. Moderacja odrzuca: mowę pogardy wobec wspólnot i wyznań, spory
   doktrynalne, dane osobowe osób trzecich, treści nie-z-doświadczenia.

## Konsekwencje architektoniczne (do wyceny w CHURCH-2)

Głosy wymagają zapisu od użytkownika: backend (konta e-mail,
przechowywanie głosów i zdjęć, kolejka moderacji) kończy erę „tylko
statycznie". Ścieżka odczytu pozostaje statyczna/cache'owana (agregaty
zapiekane do stron), ścieżka zapisu wolna, nigdy stratna. Wybór
technologii zapisu to pierwsza decyzja w `CHURCH-2` — nie przesądzam
jej tutaj.

## Warianty odrzucone

- **gwiazdki bez wymiarów** — jednoliczbowy osąd „lepszości" parafii;
  wymiary kotwiczą ocenę w doświadczeniu i dają odbiorcy kontekst;
- **ranking bez progu** — parafia z jednym entuzjastą lub jednym
  krzykaczem na szczycie/dnie; niesprawiedliwe i podatne na nabijanie;
- **oceny anonimowe** — sprzeczne z zasadą „każda ocena ma autora";
- **publikacja przed moderacją („publish-then-moderate")** — w temacie
  religijnym pierwsza fala krzywdy jest nieodwracalna.
