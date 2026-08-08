import { describe, expect, it } from 'vitest';
import { wyrozniki } from '../src/lib/parafie';

// Dane jawnie fikcyjne — nazwy testowe, niemylące się z realnymi wspólnotami.
const fakt = (wartosc: string) => ({
  wartosc,
  zrodlo: { nazwa: 'strona testowa', url: 'https://przyklad.example/zrodlo' },
  dataOdczytu: '2026-08-08',
});

describe('wyróżniki karty parafii', () => {
  it('liczy msze niedzielne z wartości osi', () => {
    const w = wyrozniki({
      osie: { mszeNiedziela: fakt('7:30 · 9:00 · 11:00 · 12:30 · 18:00') },
    });
    expect(w).toContain('5 mszy w niedzielę');
  });

  it('sygnalizuje spowiedź poza mszą i mszę z udziałem dzieci, gdy osie istnieją', () => {
    const w = wyrozniki({
      osie: {
        spowiedz: fakt('w piątki 17:00–18:00'),
        mszeSzczegolne: fakt('msza z udziałem dzieci w niedziele o 11:30'),
      },
    });
    expect(w).toContain('spowiedź także poza mszą');
    expect(w).toContain('msza z udziałem dzieci');
  });

  it('zwraca najwyżej trzy wyróżniki', () => {
    const w = wyrozniki({
      osie: {
        mszeNiedziela: fakt('8:00 · 10:00'),
        spowiedz: fakt('przed mszą'),
        mszeSzczegolne: fakt('msza z udziałem dzieci o 10:30'),
        transmisja: fakt('tak'),
      },
    });
    expect(w.length).toBeLessThanOrEqual(3);
  });
});
