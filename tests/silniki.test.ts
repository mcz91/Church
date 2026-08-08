import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { rozpoznajSilnik } from '../narzedzia/silniki.ts';

// Klasyfikacja po sygnaturach w HTML zarchiwizowanych stron — decyzja,
// które parsery pisać, wynika z danych, nie z wrażenia (docs/09, acc. 2).
const fixture = (nazwa: string) =>
  readFileSync(fileURLToPath(new URL(`./fixtures/gdansk/${nazwa}`, import.meta.url)), 'utf-8');

describe('rozpoznawanie silnika strony', () => {
  it('rozpoznaje silnik ISP (strony-parafialne.pl)', () => {
    expect(rozpoznajSilnik(fixture('strona-isp-chrystuskrol.html'))).toBe('isp');
  });

  it('rozpoznaje WordPressa', () => {
    expect(rozpoznajSilnik(fixture('wp-milosierdzia-msze.html'))).toBe('wordpress');
    expect(rozpoznajSilnik(fixture('wp-pio-msze.html'))).toBe('wordpress');
  });

  it('rozpoznaje Joomlę', () => {
    expect(rozpoznajSilnik(fixture('joomla-stanislaw-msze.html'))).toBe('joomla');
  });

  it('stronę bez znanych sygnatur klasyfikuje jako inną', () => {
    expect(rozpoznajSilnik('<!doctype html><html><body>strona</body></html>')).toBe('inny');
  });
});
