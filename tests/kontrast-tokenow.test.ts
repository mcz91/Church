import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Mechanizacja wymogu dostępności: drobne teksty w kolorze --muted
// (adnotacje źródeł, etykiety osi) muszą mieć kontrast AA ≥ 4,5:1
// na obu tłach, na których występują.
const arkusz = readFileSync(
  fileURLToPath(new URL('../src/layouts/Bazowy.astro', import.meta.url)),
  'utf-8',
);

function token(nazwa: string): string {
  const m = arkusz.match(new RegExp(`${nazwa}:\\s*(#[0-9a-f]{6})`, 'i'));
  if (!m) throw new Error(`brak tokenu ${nazwa} w Bazowy.astro`);
  return m[1];
}

function luminancja(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function kontrast(a: string, b: string): number {
  const [jasna, ciemna] = [luminancja(a), luminancja(b)].sort((x, y) => y - x);
  return (jasna + 0.05) / (ciemna + 0.05);
}

describe('kontrast tokenu --muted', () => {
  it('wynosi co najmniej 4,5:1 na tle --surface', () => {
    expect(kontrast(token('--muted'), token('--surface'))).toBeGreaterThanOrEqual(4.5);
  });

  it('wynosi co najmniej 4,5:1 na tle --bg', () => {
    expect(kontrast(token('--muted'), token('--bg'))).toBeGreaterThanOrEqual(4.5);
  });
});

// Para nocna (aneks tokenów w kontrakcie CHURCH-7, akceptacja 6).
// Wartości nocne trzymamy jako osobne tokeny z literalnym zapisem hex,
// a tryb ciemny wyłącznie je podstawia — dzięki temu obie palety są
// mierzalne tym samym testem, bez czytania reguł media.
describe('kontrast palety nocnej', () => {
  it('przygaszony tekst ma co najmniej 4,5:1 na obu nocnych tłach', () => {
    expect(kontrast(token('--noc-muted'), token('--noc-bg'))).toBeGreaterThanOrEqual(4.5);
    expect(kontrast(token('--noc-muted'), token('--noc-surface'))).toBeGreaterThanOrEqual(4.5);
  });

  it('atrament ma co najmniej 4,5:1 na obu nocnych tłach', () => {
    expect(kontrast(token('--noc-ink'), token('--noc-bg'))).toBeGreaterThanOrEqual(4.5);
    expect(kontrast(token('--noc-ink'), token('--noc-surface'))).toBeGreaterThanOrEqual(4.5);
  });

  it('zieleń rozjaśniona do czytelności na ciemnym tle', () => {
    expect(kontrast(token('--noc-accent'), token('--noc-bg'))).toBeGreaterThanOrEqual(4.5);
    expect(kontrast(token('--noc-accent'), token('--noc-surface'))).toBeGreaterThanOrEqual(4.5);
  });
});
