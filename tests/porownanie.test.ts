import { describe, expect, it } from 'vitest';
import { podzialOsi, sciezkaPorownania } from '../src/lib/porownanie';

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

// Dane jawnie fikcyjne — nazwy testowe, niemylące się z realnymi wspólnotami.
const fakt = {
  wartosc: '8:00 · 18:00',
  zrodlo: { nazwa: 'strona testowa', url: 'https://przyklad.example/zrodlo' },
  dataOdczytu: '2026-08-08',
};

describe('podział osi porównania', () => {
  it('pokazuje w tabeli oś, dla której choć jedna parafia ma fakt', () => {
    const { zDanymi } = podzialOsi({ mszeNiedziela: fakt }, { spowiedz: fakt });
    expect(zDanymi).toEqual(['mszeNiedziela', 'spowiedz']);
  });

  it('osie bez danych u obu odsuwa pod tabelę', () => {
    const { zDanymi, bezDanych } = podzialOsi({ mszeNiedziela: fakt }, { mszeNiedziela: fakt });
    expect(zDanymi).toEqual(['mszeNiedziela']);
    expect(bezDanych).toEqual([
      'mszeTydzien',
      'spowiedz',
      'dostepnosc',
      'dojazd',
      'muzyka',
      'wspolnoty',
      'mszeSzczegolne',
      'transmisja',
    ]);
  });

  it('zachowuje porządek zamkniętej listy osi', () => {
    const { zDanymi } = podzialOsi({ transmisja: fakt }, { mszeTydzien: fakt, muzyka: fakt });
    expect(zDanymi).toEqual(['mszeTydzien', 'muzyka', 'transmisja']);
  });
});
