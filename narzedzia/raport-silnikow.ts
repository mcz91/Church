import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listaBazowaSchema } from '../src/lib/lista-bazowa.ts';
import { odczekaj, pobierz } from './pobieranie.ts';
import { parsujKarteParafii } from './parser-archidiecezji.ts';
import { rozpoznajSilnik } from './silniki.ts';

// Raport silników stron z braków pokrycia (docs/09, acc. 2): decyzja,
// które parsery pisać, wynika z danych. Pojedynczy przebieg z odstępami
// (pułapka anty-botowa w pamięci operacyjnej).

const korzen = fileURLToPath(new URL('..', import.meta.url));
const dzis = new Date().toISOString().slice(0, 10);

const lista = listaBazowaSchema.parse(
  JSON.parse(readFileSync(join(korzen, 'src/dane/lista-bazowa/gdansk.json'), 'utf-8')),
);
const katalogKart = join(korzen, 'src/dane/parafie/gdansk');
const maja = new Set(
  existsSync(katalogKart)
    ? readdirSync(katalogKart).filter((p) => p.endsWith('.json')).map((p) => p.replace(/\.json$/, ''))
    : [],
);
const braki = lista.pozycje.filter((p) => !maja.has(p.slug));

const pozycje: { id: string; nazwa: string; www: string | null; silnik: string }[] = [];
for (const pozycja of braki) {
  await odczekaj(1000);
  let www: string | null = null;
  let silnik: string;
  try {
    www = parsujKarteParafii(pobierz(`${pozycja.zrodlo.url}/${pozycja.id}`))?.www ?? null;
    if (!www) {
      silnik = 'brak-www';
    } else {
      await odczekaj(1000);
      try {
        silnik = rozpoznajSilnik(pobierz(www, 15));
      } catch {
        silnik = 'martwa';
      }
    }
  } catch {
    silnik = 'katalog-niedostepny';
  }
  pozycje.push({ id: pozycja.id, nazwa: pozycja.nazwa, www, silnik });
  console.log(`${pozycja.nazwa}: ${silnik}`);
}

const rozklad: Record<string, number> = {};
for (const p of pozycje) rozklad[p.silnik] = (rozklad[p.silnik] ?? 0) + 1;

writeFileSync(
  join(korzen, 'src/dane/raporty/gdansk-silniki.json'),
  `${JSON.stringify({ dataGeneracji: dzis, rozklad, pozycje }, null, 2)}\n`,
);
console.log('Rozkład silników:', JSON.stringify(rozklad));
console.log('Raport: src/dane/raporty/gdansk-silniki.json');
