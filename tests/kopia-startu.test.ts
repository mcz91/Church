import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { OSIE, parafiaSchema } from '../src/lib/parafie';
import type { Os } from '../src/lib/parafie';

// Zero kłamstw: strona startowa nie obiecuje osi, których żadna parafia
// w danych nie pokrywa — sugerowanie danych, których nie ma, narusza
// zasadę „każdy fakt ma źródło".
const SLOWA_OSI: Record<Os, RegExp> = {
  mszeNiedziela: /msz[eay]/i,
  mszeTydzien: /msz[eay]/i,
  spowiedz: /spowied/i,
  dostepnosc: /dostępn/i,
  dojazd: /dojazd|parking|przystan/i,
  muzyka: /muzy|organ|schol/i,
  wspolnoty: /wspólnot/i,
  mszeSzczegolne: /dzieci|język|PJM/i,
  transmisja: /transmisj/i,
};

const katalogDanych = fileURLToPath(new URL('../src/dane/parafie', import.meta.url));
const parafie = readdirSync(katalogDanych)
  .filter((p) => p.endsWith('.json'))
  .map((p) => parafiaSchema.parse(JSON.parse(readFileSync(join(katalogDanych, p), 'utf-8'))));

const pokryte = new Set(
  (Object.keys(OSIE) as Os[]).filter((os) => parafie.some((p) => p.osie[os])),
);

const start = readFileSync(
  fileURLToPath(new URL('../src/pages/index.astro', import.meta.url)),
  'utf-8',
);

describe('kopia strony startowej', () => {
  for (const os of (Object.keys(OSIE) as Os[]).filter((o) => !pokryte.has(o))) {
    it(`nie wspomina osi „${OSIE[os]}", której nie pokrywa żadna parafia`, () => {
      expect(SLOWA_OSI[os].test(start)).toBe(false);
    });
  }

  it('sprawdza osie, których słowa mogą paść w kopii', () => {
    expect(Object.keys(SLOWA_OSI).sort()).toEqual(Object.keys(OSIE).sort());
  });
});
