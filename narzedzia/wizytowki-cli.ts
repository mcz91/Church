import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { parafiaSchema } from '../src/lib/parafie.ts';
import { odczekajSync, pobierz } from './pobieranie.ts';
import { przetworzWizytowki } from './wizytowki.ts';
import type { PotwierdzenieWizytowki } from './wizytowki.ts';

// Kolejka doboru zdjęć-wizytówek (docs/11): bez argumentu — podgląd
// kandydatów z API Commons, zero zapisu; z plikiem potwierdzeń
// ({wybory:[{slug,tytulPliku,alt}], braki:[{slug,przyczyna}]}) pobiera
// render ≤1600 px, zapisuje do public/wizytowki/ i uzupełnia rekord
// parafii metadanymi z API (nie z ręki); raport braków w repo.
// Sieć pojedynczo, z odstępami (pułapka anty-botowa).

const korzen = fileURLToPath(new URL('..', import.meta.url));
const katalogWizytowek = join(korzen, 'public/wizytowki');
const dzis = new Date().toISOString().slice(0, 10);
const API = 'https://commons.wikimedia.org/w/api.php';

const plikiParafii: { sciezka: string; dane: ReturnType<typeof parafiaSchema.parse> }[] = [];
for (const katalog of ['src/dane/parafie', 'src/dane/parafie/gdansk']) {
  const pelny = join(korzen, katalog);
  for (const plik of readdirSync(pelny)) {
    if (!plik.endsWith('.json')) continue;
    const sciezka = join(pelny, plik);
    plikiParafii.push({
      sciezka,
      dane: parafiaSchema.parse(JSON.parse(readFileSync(sciezka, 'utf-8'))),
    });
  }
}
const bezZdjecia = plikiParafii.filter((p) => !p.dane.zdjecie);

const zapytanieApi = (parametry: Record<string, string>): Record<string, unknown> => {
  odczekajSync(1200);
  const url = `${API}?${new URLSearchParams({ format: 'json', ...parametry })}`;
  return JSON.parse(pobierz(url, 20)) as Record<string, unknown>;
};

const plikPotwierdzen = process.argv[2];
const potwierdzenia = plikPotwierdzen
  ? (JSON.parse(readFileSync(plikPotwierdzen, 'utf-8')) as {
      wybory: PotwierdzenieWizytowki[];
      braki: { slug: string; przyczyna: string }[];
    })
  : null;

const wynik = przetworzWizytowki({
  parafie: bezZdjecia.map((p) => ({ slug: p.dane.slug, nazwa: p.dane.nazwa, miasto: p.dane.miasto })),
  potwierdzenia: potwierdzenia?.wybory ?? null,
  szukaj: (zapytanie) =>
    zapytanieApi({
      action: 'query',
      generator: 'search',
      gsrsearch: zapytanie,
      gsrnamespace: '6',
      gsrlimit: '6',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: '1280',
    }),
  pobierzInfo: (tytulPliku) => {
    const odpowiedz = zapytanieApi({
      action: 'query',
      titles: tytulPliku,
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: '1280',
    }) as { query?: { pages?: Record<string, { title?: string }> } };
    return Object.values(odpowiedz.query?.pages ?? {})[0] ?? null;
  },
  pobierzObraz: (url) => {
    odczekajSync(1200);
    return Buffer.from(pobierzBinarnie(url));
  },
  zapiszObraz: (plik, dane) => {
    mkdirSync(katalogWizytowek, { recursive: true });
    writeFileSync(join(katalogWizytowek, plik), dane);
  },
  zapiszRekord: (slug, zdjecie) => {
    const wpis = plikiParafii.find((p) => p.dane.slug === slug)!;
    const nowy = parafiaSchema.parse({ ...wpis.dane, zdjecie });
    writeFileSync(wpis.sciezka, `${JSON.stringify(nowy, null, 2)}\n`);
  },
  dataPobrania: dzis,
});

function pobierzBinarnie(url: string): Buffer {
  return execFileSync(
    'curl',
    ['-sS', '-L', '--max-time', '40', '-A', 'ChurchBot/0.1 (kontakt: macczeka@gmail.com)', url],
    { maxBuffer: 64 * 1024 * 1024 },
  );
}

if (potwierdzenia === null) {
  for (const wpis of wynik.podglad) {
    console.log(`\n== ${wpis.nazwa} [${wpis.slug}]`);
    for (const kandydat of wpis.kandydaci) {
      console.log(`   ${kandydat.tytul}`);
      console.log(`      autor: ${kandydat.autor} · ${kandydat.licencja}`);
      console.log(`      opis: ${kandydat.opis.slice(0, 120) || '(bez opisu)'}`);
      console.log(`      strona: ${kandydat.opisUrl}`);
    }
    for (const odrzucony of wpis.odrzuceni) console.log(`   — ${odrzucony.tytul}: ${odrzucony.przyczyna}`);
    if (wpis.kandydaci.length + wpis.odrzuceni.length === 0) console.log('   (zero wyników)');
  }
  console.log('\nTryb podglądu — żaden plik nie powstał.');
} else {
  console.log(`Zapisane: ${wynik.zapisane.join(', ') || '(nic)'}`);
  for (const odrzucone of wynik.odrzucone) console.log(`Odrzucone ${odrzucone.slug}: ${odrzucone.powod}`);

  const maja = plikiParafii
    .map((p) => parafiaSchema.parse(JSON.parse(readFileSync(p.sciezka, 'utf-8'))))
    .filter((p) => p.zdjecie);
  const braki = potwierdzenia.braki ?? [];
  const tresc = `# Zdjęcia-wizytówki kościołów — raport doboru

Data: ${dzis} · generat: \`npm run dane:wizytowki\` · źródło wyłącznie
Wikimedia Commons (wolne licencje), dopasowanie potwierdzone przez
człowieka na podstawie opisu/kategorii pliku w Commons.

## Parafie ze zdjęciem (${maja.length})

| Parafia | Autor | Licencja |
|---|---|---|
${maja.map((p) => `| ${p.nazwa} (${p.miasto}) | ${p.zdjecie!.autor} | ${p.zdjecie!.licencja} |`).join('\n')}

## Parafie bez zdjęcia (${braki.length})

| Parafia | Przyczyna (bez zgadywania) |
|---|---|
${braki.map((b) => `| ${b.slug} | ${b.przyczyna} |`).join('\n')}
`;
  writeFileSync(join(korzen, 'src/dane/raporty/wizytowki.md'), tresc);
  console.log('Raport: src/dane/raporty/wizytowki.md');
}
