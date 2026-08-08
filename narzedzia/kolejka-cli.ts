import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { listaBazowaSchema } from '../src/lib/lista-bazowa.ts';
import { przetworzKolejke } from './kolejka.ts';
import type { Potwierdzenie, PozycjaKolejki } from './kolejka.ts';
import { odciskZrodla } from './odswiezanie.ts';
import type { WpisRejestru } from './odswiezanie.ts';
import { odczekajSync, pobierz } from './pobieranie.ts';
import { parsujKarteParafii } from './parser-archidiecezji.ts';
import type { SzczegolyParafii } from './parser-archidiecezji.ts';

// Kolejka wyjątków ręcznych (docs/09, acc. 4). Bez argumentu: podgląd
// kandydatów, zero zapisu. Z plikiem potwierdzeń (JSON: [{pozycja, url,
// niedziela, tydzien?, spowiedz?}]) zapisuje rekordy po weryfikacji
// każdej godziny przeciw treści strony źródłowej i odnotowuje odczyt
// ręczny w rejestrze (odcisk godzinowy dla odświeżania).

const korzen = fileURLToPath(new URL('..', import.meta.url));
const katalogDanych = join(korzen, 'src/dane/parafie/gdansk');
const sciezkaRejestru = join(korzen, 'src/dane/raporty/gdansk-reczne.json');
const dzis = new Date().toISOString().slice(0, 10);

const lista = listaBazowaSchema.parse(
  JSON.parse(readFileSync(join(korzen, 'src/dane/lista-bazowa/gdansk.json'), 'utf-8')),
);
const maja = new Set(
  readdirSync(katalogDanych).filter((p) => p.endsWith('.json')).map((p) => p.replace(/\.json$/, '')),
);
const braki = lista.pozycje.filter((p) => !maja.has(p.slug));

const plikPotwierdzen = process.argv[2];
const potwierdzenia: Potwierdzenie[] | null = plikPotwierdzen
  ? (JSON.parse(readFileSync(plikPotwierdzen, 'utf-8')) as Potwierdzenie[])
  : null;

// Karty katalogu (adres + www) pobierane raz, z odstępem.
const karty = new Map<string, SzczegolyParafii | null>();
const pobierzKarte = (id: string): SzczegolyParafii | null => {
  if (!karty.has(id)) {
    odczekajSync(1000);
    try {
      karty.set(id, parsujKarteParafii(pobierz(`https://www.diecezja.gda.pl/parafie/${id}`)));
    } catch {
      karty.set(id, null);
    }
  }
  return karty.get(id) ?? null;
};

const bufor = new Map<string, string>();
const pobierzStrone = (url: string): string => {
  if (!bufor.has(url)) {
    odczekajSync(1000);
    bufor.set(url, pobierz(url, 15));
  }
  return bufor.get(url)!;
};

const pozycje: PozycjaKolejki[] = braki.map((p) => {
  const wpis: PozycjaKolejki = { id: p.id, nazwa: p.nazwa, slug: p.slug };
  if (potwierdzenia === null) {
    const www = pobierzKarte(p.id)?.www;
    if (www) wpis.www = www;
  }
  return wpis;
});

const wynik = przetworzKolejke({
  pozycje,
  potwierdzenia,
  pobierz: pobierzStrone,
  pobierzKarte,
  zapisz: (slug, rekord) =>
    writeFileSync(join(katalogDanych, `${slug}.json`), `${JSON.stringify(rekord, null, 2)}\n`),
  dataOdczytu: dzis,
});

if (potwierdzenia === null) {
  for (const wpis of wynik.podglad) {
    console.log(`\n== ${wpis.nazwa} [${wpis.pozycja}] ${wpis.url ?? '(bez www)'}`);
    for (const linia of wpis.kandydaci) console.log(`   ${linia}`);
    if (wpis.kandydaci.length === 0) console.log('   (żadnych kandydatów)');
  }
  console.log('\nTryb podglądu — żaden plik nie powstał. Zapis: npm run dane:kolejka -- <plik-potwierdzen.json>');
} else {
  const rejestr: WpisRejestru[] = existsSync(sciezkaRejestru)
    ? (JSON.parse(readFileSync(sciezkaRejestru, 'utf-8')) as WpisRejestru[])
    : [];
  for (const potwierdzenie of potwierdzenia) {
    const pozycja = pozycje.find((p) => p.id === potwierdzenie.pozycja);
    if (!pozycja || !wynik.zapisane.includes(pozycja.slug)) continue;
    const nowy: WpisRejestru = {
      slug: pozycja.slug,
      url: potwierdzenie.url,
      dataOdczytu: dzis,
      odcisk: odciskZrodla(pobierzStrone(potwierdzenie.url)),
    };
    const i = rejestr.findIndex((w) => w.slug === nowy.slug);
    if (i >= 0) rejestr[i] = nowy;
    else rejestr.push(nowy);
  }
  writeFileSync(sciezkaRejestru, `${JSON.stringify(rejestr, null, 2)}\n`);
  console.log(`Zapisane: ${wynik.zapisane.join(', ') || '(nic)'}`);
  for (const odrzucone of wynik.odrzucone) {
    console.log(`Odrzucone ${odrzucone.pozycja}: ${odrzucone.powod}`);
  }
}
