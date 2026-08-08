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

Obowiązujący kierunek operatora (2026-08-08): rdzeniem produktu są
oceny odwiedzających, pozyskiwanie danych mocno zautomatyzowane.
Aktualny brief:
[`briefs/PB-002-oceny-odwiedzajacych-automatyzacja.md`](briefs/PB-002-oceny-odwiedzajacych-automatyzacja.md)
(wynik kwalifikacji PM: buduj, zakres pilotażowy; zastępuje PB-001).
Czeka na decyzje operatora z sekcji `BRAK` briefu — w tym zatwierdzenie
interpretacji polecenia i wybór miasta pilotażu. Po zatwierdzeniu
architekt kwalifikuje brief i pisze kontrakt `CHURCH-1`.
