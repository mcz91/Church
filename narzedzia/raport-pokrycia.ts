import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listaBazowaSchema } from '../src/lib/lista-bazowa.ts';
import { policzPokrycie } from './pokrycie.ts';

// Raport pokrycia listy bazowej Gdańska — plik w repo; wynik ≥90% albo
// raport braków z przyczyną źródłową per pozycja (kontrakt CHURCH-3,
// akceptacja 4). Start pilotażu poniżej 90% pozostaje decyzją operatora.

const korzen = fileURLToPath(new URL('..', import.meta.url));
const dzis = new Date().toISOString().slice(0, 10);

const lista = listaBazowaSchema.parse(
  JSON.parse(readFileSync(join(korzen, 'src/dane/lista-bazowa/gdansk.json'), 'utf-8')),
);
const katalogKart = join(korzen, 'src/dane/parafie/gdansk');
const slugiKart = new Set(
  existsSync(katalogKart)
    ? readdirSync(katalogKart)
        .filter((p) => p.endsWith('.json'))
        .map((p) => p.replace(/\.json$/, ''))
    : [],
);
const sciezkaWyjatkow = join(korzen, 'src/dane/raporty/gdansk-wyjatki.json');
const wyjatki = existsSync(sciezkaWyjatkow)
  ? (JSON.parse(readFileSync(sciezkaWyjatkow, 'utf-8')) as {
      wyjatki: { pozycja: string; przyczyna: string }[];
    }).wyjatki
  : [];

// Wyniki ręcznego przejścia kolejki wyjątków mają pierwszeństwo przed
// automatycznym raportem pipeline'u — niosą przyczynę z datą sprawdzenia.
const sciezkaSprawdzen = join(korzen, 'src/dane/raporty/gdansk-kolejka-sprawdzenia.json');
const sprawdzenia = existsSync(sciezkaSprawdzen)
  ? (JSON.parse(readFileSync(sciezkaSprawdzen, 'utf-8')) as {
      sprawdzenia: { pozycja: string; przyczyna: string }[];
    }).sprawdzenia
  : [];
const przyczyny = [
  ...sprawdzenia,
  ...wyjatki.filter((w) => !sprawdzenia.some((s) => s.pozycja === w.pozycja)),
];

const raport = policzPokrycie(lista.pozycje, slugiKart, przyczyny);

const wiersze = raport.braki
  .map((b) => `| ${b.nazwa} | ${b.przyczyna} |`)
  .join('\n');
const tresc = `# Pokrycie listy bazowej — Gdańsk

Data raportu: ${dzis} · generat: \`npm run dane:pokrycie\`

**Pokrycie: ${raport.procent}%** (${raport.nadProgiem} z ${raport.mianownik} pozycji listy
bazowej ma kartę nad progiem jakości: nazwa, wyznanie, adres, msze niedzielne —
każdy fakt ze źródłem i datą odczytu).

Ograniczenie mianownika: ${lista.pozaMianownikiem}

${
  raport.braki.length === 0
    ? 'Braków nie ma.'
    : `## Braki per pozycja (przyczyna źródłowa)

| Pozycja | Przyczyna |
|---|---|
${wiersze}`
}
`;

writeFileSync(join(korzen, 'src/dane/raporty/gdansk-pokrycie.md'), tresc);
console.log(`Pokrycie: ${raport.procent}% (${raport.nadProgiem}/${raport.mianownik}); braki: ${raport.braki.length}.`);
console.log('Raport: src/dane/raporty/gdansk-pokrycie.md');
