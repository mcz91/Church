import { describe, expect, it } from 'vitest';
import { PROG_RANKINGU, rankingMiejski } from '../src/lib/ranking';

// Dane jawnie fikcyjne — slugi testowe.
const wpis = (slug: string, ocena: number, liczba: number) => ({ slug, ocena, liczba });

describe('ranking miejski', () => {
  it('przyjmuje do zestawienia wyłącznie parafie z co najmniej pięcioma głosami', () => {
    expect(PROG_RANKINGU).toBe(5);
    const ranking = rankingMiejski([
      wpis('parafia-testowa-alfa', 4.8, 6),
      wpis('parafia-testowa-beta', 5, 4),
    ]);
    expect(ranking?.pozycje.map((p) => p.slug)).toEqual(['parafia-testowa-alfa']);
  });

  it('parafie poniżej progu wymienia jako „za mało głosów", nigdy z pozycją', () => {
    const ranking = rankingMiejski([
      wpis('parafia-testowa-alfa', 4.8, 6),
      wpis('parafia-testowa-beta', 5, 4),
      wpis('parafia-testowa-gamma', 3, 0),
    ]);
    expect(ranking?.zaMaloGlosow).toEqual(['parafia-testowa-beta', 'parafia-testowa-gamma']);
  });

  it('sortuje po średniej ogólnej malejąco', () => {
    const ranking = rankingMiejski([
      wpis('parafia-testowa-alfa', 4.2, 7),
      wpis('parafia-testowa-beta', 4.9, 5),
    ]);
    expect(ranking?.pozycje.map((p) => [p.slug, p.pozycja])).toEqual([
      ['parafia-testowa-beta', 1],
      ['parafia-testowa-alfa', 2],
    ]);
  });

  it('remisy dzielą pozycję, a kolejna pozycja uwzględnia liczbę remisujących', () => {
    const ranking = rankingMiejski([
      wpis('parafia-testowa-alfa', 4.5, 6),
      wpis('parafia-testowa-beta', 4.5, 9),
      wpis('parafia-testowa-gamma', 4.1, 5),
    ]);
    expect(ranking?.pozycje.map((p) => p.pozycja)).toEqual([1, 1, 3]);
  });

  it('bez parafii nad progiem nie ma rankingu wcale (fail-closed)', () => {
    expect(rankingMiejski([wpis('parafia-testowa-alfa', 5, 4)])).toBeNull();
    expect(rankingMiejski([])).toBeNull();
  });
});
