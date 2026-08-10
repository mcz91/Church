import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parafiaSchema } from '../src/lib/parafie.ts';
import { odczekajSync, pobierz } from './pobieranie.ts';
import { kafelkiWokol, wybierzTrafienie, zapytanieOPolozenie } from '../src/lib/mapki.ts';

// Mapki parafii: położenie z Nominatim (ODbL), kafelki z tile.openstreetmap.org
// zapisane do repo. Sieć pojedynczo, z odstępami — polityka OSM zabrania
// masowego pobierania, a i tak obowiązuje nas zasada anty-botowa.
// Trafienie inne niż miejsce kultu odrzucamy, nie zgadujemy.

const korzen = fileURLToPath(new URL('..', import.meta.url));
const katalogMapek = join(korzen, 'public/mapki');
const dzis = new Date().toISOString().slice(0, 10);
const ZOOM = 16;
const AGENT = 'ChurchBot/0.1 (kontakt: macczeka@gmail.com)';
const ZRODLO = { nazwa: 'OpenStreetMap (Nominatim), ODbL', url: 'https://www.openstreetmap.org/copyright' };

const pliki: { sciezka: string; dane: ReturnType<typeof parafiaSchema.parse> }[] = [];
for (const katalog of ['src/dane/parafie', 'src/dane/parafie/gdansk']) {
  const pelny = join(korzen, katalog);
  for (const plik of readdirSync(pelny)) {
    if (!plik.endsWith('.json')) continue;
    const sciezka = join(pelny, plik);
    pliki.push({ sciezka, dane: parafiaSchema.parse(JSON.parse(readFileSync(sciezka, 'utf-8'))) });
  }
}

const pobierzBinarnie = (url: string): Buffer =>
  execFileSync('curl', ['-sS', '-L', '--max-time', '40', '-A', AGENT, url], {
    maxBuffer: 16 * 1024 * 1024,
  });

mkdirSync(katalogMapek, { recursive: true });
const braki: { slug: string; przyczyna: string }[] = [];
let zapisane = 0;

for (const wpis of pliki) {
  if (wpis.dane.polozenie) continue;

  odczekajSync(1200);
  const zapytanie = zapytanieOPolozenie(wpis.dane.adres.wartosc);
  const url =
    'https://nominatim.openstreetmap.org/search?' +
    new URLSearchParams({ format: 'jsonv2', limit: '3', countrycodes: 'pl', q: zapytanie });
  let trafienia: { lat: string; lon: string; category?: string; type?: string }[];
  try {
    trafienia = JSON.parse(pobierz(url, 20));
  } catch {
    braki.push({ slug: wpis.dane.slug, przyczyna: 'geokoder nie odpowiedział' });
    continue;
  }

  const polozenie = wybierzTrafienie(trafienia);
  if (!polozenie) {
    braki.push({
      slug: wpis.dane.slug,
      przyczyna: `brak jednoznacznego trafienia „miejsce kultu" dla adresu „${zapytanie}"`,
    });
    console.log(`— ${wpis.dane.slug}: bez pewnego trafienia`);
    continue;
  }

  const blok = kafelkiWokol(polozenie.szerokosc, polozenie.dlugosc, ZOOM);
  blok.kafelki.forEach((kafel, i) => {
    const plik = join(katalogMapek, `${wpis.dane.slug}-${i + 1}.png`);
    if (existsSync(plik)) return;
    odczekajSync(1200);
    writeFileSync(plik, pobierzBinarnie(`https://tile.openstreetmap.org/${ZOOM}/${kafel.x}/${kafel.y}.png`));
  });

  const nowy = parafiaSchema.parse({
    ...wpis.dane,
    polozenie: { ...polozenie, zrodlo: ZRODLO, dataOdczytu: dzis },
  });
  writeFileSync(wpis.sciezka, `${JSON.stringify(nowy, null, 2)}\n`);
  zapisane += 1;
  console.log(`+ ${wpis.dane.slug}: ${polozenie.szerokosc}, ${polozenie.dlugosc}`);
}

const zPolozeniem = pliki
  .map((p) => parafiaSchema.parse(JSON.parse(readFileSync(p.sciezka, 'utf-8'))))
  .filter((p) => p.polozenie);
writeFileSync(
  join(korzen, 'src/dane/raporty/mapki.md'),
  `# Mapki parafii — raport doboru położenia

Data: ${dzis} · generat: \`npm run dane:mapki\` · źródło: OpenStreetMap
(Nominatim, ODbL). Przyjmujemy wyłącznie trafienie typu „miejsce kultu"
w granicach Polski — adres pasujący do sąsiedniego budynku odpada.

## Parafie z położeniem (${zPolozeniem.length} z ${pliki.length})

| Parafia | Szerokość | Długość |
|---|---|---|
${zPolozeniem.map((p) => `| ${p.nazwa} (${p.miasto}) | ${p.polozenie!.szerokosc} | ${p.polozenie!.dlugosc} |`).join('\n')}

## Bez położenia (${braki.length})

| Parafia | Przyczyna (bez zgadywania) |
|---|---|
${braki.map((b) => `| ${b.slug} | ${b.przyczyna} |`).join('\n') || '| — | — |'}
`,
);
console.log(`\nZapisane: ${zapisane} · bez pewnego trafienia: ${braki.length}`);
console.log('Raport: src/dane/raporty/mapki.md');
