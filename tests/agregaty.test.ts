import { describe, expect, it } from 'vitest';
import { glosyParafii, policzAgregaty } from '../src/lib/agregaty';
import type { Glos } from '../src/lib/glosy';

// Dane jawnie fikcyjne — pseudonimy i nazwy testowe.
let licznik = 0;
function glos(
  parafiaSlug: string,
  ocenaOgolna: number,
  status: Glos['status'] = 'approved',
  wymiary?: Partial<Glos['wymiary']>,
): Glos {
  licznik += 1;
  return {
    parafiaSlug,
    autor: { pseudonim: `Osoba Testowa ${licznik}`, konto: `konto-test-${licznik}` },
    status,
    ocenaOgolna,
    wymiary: { przyjecie: 4, muzyka: 4, zDziecmi: 4, dostepnosc: 4, organizacja: 4, ...wymiary },
    data: '2026-08-08',
  };
}

describe('głosy jednej parafii', () => {
  it('wybiera wyłącznie głosy approved wskazanej parafii', () => {
    const wybor = glosyParafii('parafia-testowa-alfa', [
      glos('parafia-testowa-alfa', 5),
      glos('parafia-testowa-alfa', 4, 'pending'),
      glos('parafia-testowa-alfa', 3, 'rejected'),
      glos('parafia-testowa-beta', 1),
    ]);
    expect(wybor.glosy).toHaveLength(1);
    expect(wybor.glosy[0].ocenaOgolna).toBe(5);
  });
});

describe('agregaty parafii', () => {
  it('nie istnieją bez ani jednego głosu approved', () => {
    const wybor = glosyParafii('parafia-testowa-alfa', [glos('parafia-testowa-alfa', 5, 'pending')]);
    expect(policzAgregaty(wybor)).toBeNull();
  });

  it('liczą średnią ogólną, średnie wymiarów i liczność', () => {
    const wybor = glosyParafii('parafia-testowa-alfa', [
      glos('parafia-testowa-alfa', 5, 'approved', { muzyka: 5 }),
      glos('parafia-testowa-alfa', 4, 'approved', { muzyka: 4 }),
    ]);
    const agregaty = policzAgregaty(wybor);
    expect(agregaty).not.toBeNull();
    expect(agregaty?.liczba).toBe(2);
    expect(agregaty?.ogolna).toBe(4.5);
    expect(agregaty?.wymiary.muzyka).toBe(4.5);
    expect(agregaty?.wymiary.przyjecie).toBe(4);
  });

  it('zaokrągla średnie do jednego miejsca po przecinku', () => {
    const wybor = glosyParafii('parafia-testowa-alfa', [
      glos('parafia-testowa-alfa', 5),
      glos('parafia-testowa-alfa', 4),
      glos('parafia-testowa-alfa', 4),
    ]);
    expect(policzAgregaty(wybor)?.ogolna).toBe(4.3);
  });
});
