# Church

Church to porównywarka kościołów: produkt, który pozwala znaleźć, porównać
i udostępnić informacje o kościołach i wspólnotach — z ambicją wirusowości
opartą na wartości dla użytkownika, nigdy na kpinie czy konflikcie.

Repozytorium jest pod kontrolą Foundry (`mcz91/foundry`). Obowiązuje
[`CONSTITUTION.md`](CONSTITUTION.md).

**Bieżący etap, ograniczenia i następny krok:**
[`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md).

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
