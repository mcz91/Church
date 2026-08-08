import { OSIE } from './parafie';
import type { Os } from './parafie';

// Jeden kanoniczny adres pary: slugi zawsze w porządku alfabetycznym,
// niezależnie od kolejności podania — UI nigdy nie generuje odwrotnego.
export function kanonicznaPara(a: string, b: string): [string, string] {
  if (a === b) throw new Error(`porównanie wymaga dwóch różnych parafii, podano dwukrotnie „${a}"`);
  return a < b ? [a, b] : [b, a];
}

export function sciezkaPorownania(a: string, b: string): string {
  const [pierwszy, drugi] = kanonicznaPara(a, b);
  return `/porownaj/${pierwszy}-vs-${drugi}`;
}

// Wiersze pustych po obu stronach nie pokazujemy w tabeli, ale osie bez
// danych pozostają wyliczone pod nią — uczciwość braków ma być widoczna.
export function podzialOsi(
  a: Partial<Record<Os, unknown>>,
  b: Partial<Record<Os, unknown>>,
): { zDanymi: Os[]; bezDanych: Os[] } {
  const zDanymi: Os[] = [];
  const bezDanych: Os[] = [];
  for (const os of Object.keys(OSIE) as Os[]) {
    (a[os] || b[os] ? zDanymi : bezDanych).push(os);
  }
  return { zDanymi, bezDanych };
}
