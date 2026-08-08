import { describe, expect, it } from 'vitest';
import { parafiaSchema } from '../src/lib/parafie';

// Dane jawnie fikcyjne — nazwy testowe, niemylące się z realnymi wspólnotami.
const fakt = {
  wartosc: '8:00 · 18:00',
  zrodlo: {
    nazwa: 'strona testowa',
    url: 'https://przyklad.example/zrodlo',
  },
  dataOdczytu: '2026-08-08',
};

const parafia = {
  nazwa: 'Parafia Testowa Alfa',
  wyznanie: 'testowe',
  miasto: 'Miasto Przykładowe',
  miastoSlug: 'miasto-przykladowe',
  slug: 'parafia-testowa-alfa',
  adres: fakt,
  osie: {
    mszeNiedziela: fakt,
  },
};

describe('schemat parafii', () => {
  it('przyjmuje rekord, którego każdy fakt ma źródło i datę odczytu', () => {
    expect(parafiaSchema.safeParse(parafia).success).toBe(true);
  });

  it('odrzuca fakt bez źródła', () => {
    const bezZrodla = {
      ...parafia,
      osie: { mszeNiedziela: { wartosc: fakt.wartosc, dataOdczytu: fakt.dataOdczytu } },
    };
    expect(parafiaSchema.safeParse(bezZrodla).success).toBe(false);
  });

  it('odrzuca fakt bez daty odczytu', () => {
    const bezDaty = {
      ...parafia,
      osie: { mszeNiedziela: { wartosc: fakt.wartosc, zrodlo: fakt.zrodlo } },
    };
    expect(parafiaSchema.safeParse(bezDaty).success).toBe(false);
  });

  it('odrzuca adres bez źródła lub daty', () => {
    expect(parafiaSchema.safeParse({ ...parafia, adres: { wartosc: 'ul. Testowa 1' } }).success).toBe(false);
  });

  it('odrzuca oś spoza zamkniętej listy dokumentu 01', () => {
    const obcaOs = { ...parafia, osie: { ...parafia.osie, ocenaJakosci: fakt } };
    expect(parafiaSchema.safeParse(obcaOs).success).toBe(false);
  });
});
