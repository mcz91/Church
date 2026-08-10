import { describe, expect, it } from 'vitest';
import { dataOstatniejZmiany } from '../src/lib/swiezosc.ts';

// Stopka zaufania (CHURCH-7 akc. 9) pokazuje, kiedy dane ostatnio się
// zmieniły. Liczy się to z plików builda, nigdy z zegara — inaczej
// data „ostatniej zmiany" rosłaby przy każdym przebudowaniu, choć
// żaden fakt by się nie ruszył. Dane jawnie fikcyjne.

const fakt = (dataOdczytu: string) => ({
  wartosc: 'x',
  zrodlo: { nazwa: 'strona testowa', url: 'https://przyklad.example/z' },
  dataOdczytu,
});

describe('data ostatniej zmiany danych', () => {
  it('bierze najnowszą datę odczytu spośród wszystkich faktów', () => {
    const parafie = [
      { adres: fakt('2026-07-01'), osie: { mszeNiedziela: fakt('2026-08-08') } },
      { adres: fakt('2026-06-30'), osie: { spowiedz: fakt('2026-07-15') } },
    ];
    expect(dataOstatniejZmiany(parafie)).toBe('2026-08-08');
  });

  it('uwzględnia datę pobrania zdjęcia-wizytówki', () => {
    const parafie = [
      {
        adres: fakt('2026-07-01'),
        osie: {},
        zdjecie: {
          plik: 'x.jpg',
          alt: 'x',
          autor: 'x',
          licencja: 'CC0',
          zrodloUrl: 'https://przyklad.example/plik',
          dataPobrania: '2026-08-10',
        },
      },
    ];
    expect(dataOstatniejZmiany(parafie)).toBe('2026-08-10');
  });

  it('bez danych nie zmyśla daty', () => {
    expect(dataOstatniejZmiany([])).toBeNull();
  });

  it('nie zależy od kolejności rekordów', () => {
    const a = { adres: fakt('2026-01-02'), osie: {} };
    const b = { adres: fakt('2026-03-04'), osie: {} };
    expect(dataOstatniejZmiany([a, b])).toBe(dataOstatniejZmiany([b, a]));
  });
});
