import { describe, expect, it } from 'vitest';
import { policzPokrycie } from '../narzedzia/pokrycie.ts';

// Dane jawnie fikcyjne — pozycje testowe.
const pozycje = [
  { id: '1', nazwa: 'Wspólnota Testowa Alfa', slug: 'alfa' },
  { id: '2', nazwa: 'Wspólnota Testowa Beta', slug: 'beta' },
  { id: '3', nazwa: 'Wspólnota Testowa Gamma', slug: 'gamma' },
];

describe('raport pokrycia listy bazowej', () => {
  it('liczy odsetek pozycji z kartą nad progiem', () => {
    const raport = policzPokrycie(pozycje, new Set(['alfa', 'beta']), []);
    expect(raport.mianownik).toBe(3);
    expect(raport.nadProgiem).toBe(2);
    expect(raport.procent).toBe(66.7);
  });

  it('wskazuje per pozycja przyczynę źródłową braku', () => {
    const raport = policzPokrycie(pozycje, new Set(['alfa']), [
      { pozycja: '2', przyczyna: 'strona parafii bez jednoznacznej struktury' },
    ]);
    expect(raport.braki).toEqual([
      { pozycja: '2', nazwa: 'Wspólnota Testowa Beta', przyczyna: 'strona parafii bez jednoznacznej struktury' },
      { pozycja: '3', nazwa: 'Wspólnota Testowa Gamma', przyczyna: 'przyczyna niezarejestrowana w raporcie wyjątków' },
    ]);
  });

  it('pusta lista daje zero procent bez dzielenia przez zero', () => {
    expect(policzPokrycie([], new Set(), []).procent).toBe(0);
  });

  it('komplet kart daje sto procent i pustą listę braków', () => {
    const raport = policzPokrycie(pozycje, new Set(['alfa', 'beta', 'gamma']), []);
    expect(raport.procent).toBe(100);
    expect(raport.braki).toEqual([]);
  });
});
