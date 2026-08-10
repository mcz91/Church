import { describe, expect, it } from 'vitest';
import { cechyParafii, wyrozniki } from '../src/lib/parafie';

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

  it('liczy godziny, nie separatory — wartość bez „·" nie udaje jednej mszy', () => {
    const w = wyrozniki({
      osie: { mszeNiedziela: fakt('08:00 09:30 11:00 - dla dzieci 12:30 - Suma 18:00 19:15') },
    });
    expect(w).toContain('6 mszy w niedzielę');
  });

  it('nie liczy godzin z dopisków w nawiasach', () => {
    const w = wyrozniki({
      osie: { mszeNiedziela: fakt('7:30 · 18:00 (16:00 w okresie zimowym)') },
    });
    expect(w).toContain('2 msze w niedzielę');
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

describe('cechy parafii do filtrowania', () => {
  it('czyta udział dzieci i młodzieży także z porządku niedzielnego', () => {
    const c = cechyParafii({
      osie: { mszeNiedziela: fakt('8:00 · 11:00 (dla dzieci) · 18:00 (dla młodzieży)') },
    });
    expect(c).toContain('dzieci');
    expect(c).toContain('mlodziez');
  });

  it('sygnalizuje spowiedź wyłącznie wtedy, gdy oś istnieje', () => {
    expect(cechyParafii({ osie: { spowiedz: fakt('w piątki 17:00–18:00') } })).toContain('spowiedz');
    expect(cechyParafii({ osie: { mszeNiedziela: fakt('8:00') } })).not.toContain('spowiedz');
  });

  it('parafia bez sygnałów nie dostaje żadnej cechy', () => {
    expect(cechyParafii({ osie: { mszeNiedziela: fakt('8:00 · 10:00') } })).toEqual([]);
  });
});
