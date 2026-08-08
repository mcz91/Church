import { describe, expect, it } from 'vitest';
import { sciezkaPorownania } from '../src/lib/porownanie';

describe('kanoniczny adres porównania', () => {
  it('składa slugi w porządku alfabetycznym', () => {
    expect(sciezkaPorownania('ambona', 'zakrystia')).toBe('/porownaj/ambona-vs-zakrystia');
  });

  it('dla pary podanej w odwrotnej kolejności wyznacza ten sam adres', () => {
    expect(sciezkaPorownania('zakrystia', 'ambona')).toBe(sciezkaPorownania('ambona', 'zakrystia'));
  });

  it('odmawia porównania parafii z samą sobą', () => {
    expect(() => sciezkaPorownania('ambona', 'ambona')).toThrow();
  });
});
