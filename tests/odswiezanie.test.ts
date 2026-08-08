import { describe, expect, it } from 'vitest';
import { odswiezRekord } from '../narzedzia/odswiezanie.ts';
import type { Parafia } from '../src/lib/parafie';

// Dane jawnie fikcyjne — nazwy testowe.
const fakt = (wartosc: string, dataOdczytu: string) => ({
  wartosc,
  zrodlo: { nazwa: 'strona testowa', url: 'https://przyklad.example/zrodlo' },
  dataOdczytu,
});

const istniejacy: Parafia = {
  nazwa: 'Parafia Testowa Alfa',
  wyznanie: 'testowe',
  miasto: 'Miasto Przykładowe',
  miastoSlug: 'miasto-przykladowe',
  slug: 'parafia-testowa-alfa',
  adres: fakt('ul. Testowa 1', '2026-07-01'),
  osie: {
    mszeNiedziela: fakt('8:00 · 10:00', '2026-07-01'),
    mszeTydzien: fakt('7:00', '2026-07-01'),
  },
};

describe('odświeżanie rekordu wobec świeżego odczytu źródła', () => {
  it('niezmienione źródło nie daje żadnego diffu — stary rekord wraca co do bajta', () => {
    const swiezy: Parafia = {
      ...istniejacy,
      adres: fakt('ul. Testowa 1', '2026-08-08'),
      osie: {
        mszeNiedziela: fakt('8:00 · 10:00', '2026-08-08'),
        mszeTydzien: fakt('7:00', '2026-08-08'),
      },
    };
    const { rekord, zmieniono } = odswiezRekord(istniejacy, swiezy);
    expect(zmieniono).toBe(false);
    expect(rekord).toEqual(istniejacy);
  });

  it('zmiana wartości w źródle daje nową wartość z nową dataOdczytu', () => {
    const swiezy: Parafia = {
      ...istniejacy,
      adres: fakt('ul. Testowa 1', '2026-08-08'),
      osie: {
        mszeNiedziela: fakt('8:00 · 10:00 · 12:00', '2026-08-08'),
        mszeTydzien: fakt('7:00', '2026-08-08'),
      },
    };
    const { rekord, zmieniono } = odswiezRekord(istniejacy, swiezy);
    expect(zmieniono).toBe(true);
    expect(rekord.osie.mszeNiedziela?.wartosc).toBe('8:00 · 10:00 · 12:00');
    expect(rekord.osie.mszeNiedziela?.dataOdczytu).toBe('2026-08-08');
    expect(rekord.osie.mszeTydzien?.dataOdczytu).toBe('2026-07-01');
    expect(rekord.adres).toEqual(istniejacy.adres);
  });

  it('oś nieobecna w świeżym odczycie zostaje — brak odczytu to nie dowód zniknięcia', () => {
    const swiezy: Parafia = {
      ...istniejacy,
      adres: fakt('ul. Testowa 1', '2026-08-08'),
      osie: { mszeNiedziela: fakt('8:00 · 10:00', '2026-08-08') },
    };
    const { rekord, zmieniono } = odswiezRekord(istniejacy, swiezy);
    expect(zmieniono).toBe(false);
    expect(rekord.osie.mszeTydzien).toEqual(istniejacy.osie.mszeTydzien);
  });
});
