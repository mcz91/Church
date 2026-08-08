import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parafiaSchema } from '../src/lib/parafie';

const katalog = fileURLToPath(new URL('../src/dane/parafie', import.meta.url));
const pliki = readdirSync(katalog).filter((p) => p.endsWith('.json'));
const rekordy = pliki.map((p) => ({
  plik: p,
  dane: JSON.parse(readFileSync(join(katalog, p), 'utf-8')) as unknown,
}));

describe('dane parafii', () => {
  it('zawierają co najmniej trzy parafie', () => {
    expect(rekordy.length).toBeGreaterThanOrEqual(3);
  });

  for (const { plik, dane } of rekordy) {
    it(`${plik} przechodzi schemat (każdy fakt ze źródłem i datą)`, () => {
      const wynik = parafiaSchema.safeParse(dane);
      expect(wynik.success, JSON.stringify(!wynik.success && wynik.error.issues, null, 2)).toBe(true);
    });
  }

  it('opisują dokładnie jedno miasto startowe', () => {
    const parsy = rekordy.map((r) => parafiaSchema.parse(r.dane));
    expect(new Set(parsy.map((p) => p.miasto)).size).toBe(1);
    expect(new Set(parsy.map((p) => p.miastoSlug)).size).toBe(1);
  });

  it('mają unikatowe slugi', () => {
    const parsy = rekordy.map((r) => parafiaSchema.parse(r.dane));
    expect(new Set(parsy.map((p) => p.slug)).size).toBe(parsy.length);
  });
});
