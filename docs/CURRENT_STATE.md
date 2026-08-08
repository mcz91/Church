# Stan bieżący — Church

Jedyne źródło etapu, ograniczeń i następnego kroku. Inne dokumenty
linkują tutaj zamiast utrzymywać własne kopie.

## Etap

**0 — bootstrap.** Repozytorium zawiera wyłącznie konstytucję, prompty
ról, pamięć operacyjną i ten dokument. Nie ma kodu produktu, testów,
bramki CI ani registry kontraktów.

## Ograniczenia

- stos technologiczny nie został wybrany — to pierwsza decyzja
  architektoniczna, poprzedzona pierwszym ProductBriefem PM-a;
- komendy weryfikacji nie istnieją; pojawią się wraz z pierwszym kodem
  i zostaną wyliczone w `README.md`;
- registry kontraktów `CHURCH-N` nie istnieje; do jego powstania kontrakt
  jest przekazywany w treści zadania i musi zawierać komplet pól
  opisanych w `PROMPT_ARCHITEKT.md`.

## Następny krok

Obowiązuje zatwierdzony brief
[`briefs/PB-002-oceny-odwiedzajacych-automatyzacja.md`](briefs/PB-002-oceny-odwiedzajacych-automatyzacja.md):
rdzeniem produktu są moderowane oceny odwiedzających na automatycznie
zasilanym katalogu; pilotaż w Gdańsku; metryka północna: tygodniowa
liczba opublikowanych ocen odwiedzających. Komplet decyzji operatora
w sekcji „Decyzje operatora" briefu.

Następny krok: sesja architekta (`PROMPT_ARCHITEKT.md`) kwalifikuje
PB-002 i pisze kontrakt `CHURCH-1` — pierwszy kontrakt kodu musi
ustanowić komendy weryfikacji w `README.md`.
