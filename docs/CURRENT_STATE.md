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

PM formułuje pierwszy ProductBrief (hipoteza wirusowości + metryka +
najtańszy eksperyment). Architekt kwalifikuje go i — jeśli wynik brzmi
„buduj" — pisze kontrakt `CHURCH-1`.
