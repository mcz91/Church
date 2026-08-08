import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listaBazowaSchema } from '../src/lib/lista-bazowa.ts';
import { parafiaSchema } from '../src/lib/parafie.ts';
import { doPrzegladu, odswiezRekord, planPozycji } from './odswiezanie.ts';
import type { WpisRejestru } from './odswiezanie.ts';
import { odczekaj, pobierz } from './pobieranie.ts';
import { pobierzMszeZeZrodel } from './msze-zrodla.ts';
import { parsujKarteParafii } from './parser-archidiecezji.ts';
import { zbudujRekord } from './rekordy.ts';

// Odświeżenie danych Gdańska wobec żywych źródeł: zmiana wartości daje
// diff pliku z nową datą odczytu; niezmienione źródło nie daje niczego.
// Rekord ręczny nigdy nie jest nadpisywany automatycznie — zmiana jego
// źródła trafia do raportu „do przeglądu ręcznego" (docs/09, acc. 5).
// Harmonogram uruchomień czeka na BRAK: hosting/CI.

const korzen = fileURLToPath(new URL('..', import.meta.url));
const katalogDanych = join(korzen, 'src/dane/parafie/gdansk');
const sciezkaRejestru = join(korzen, 'src/dane/raporty/gdansk-reczne.json');
const dzis = new Date().toISOString().slice(0, 10);

const lista = listaBazowaSchema.parse(
  JSON.parse(readFileSync(join(korzen, 'src/dane/lista-bazowa/gdansk.json'), 'utf-8')),
);
const rejestr: WpisRejestru[] = existsSync(sciezkaRejestru)
  ? (JSON.parse(readFileSync(sciezkaRejestru, 'utf-8')) as WpisRejestru[])
  : [];

let zmienione = 0;
let bezZmian = 0;
let pominiete = 0;
const przeglad: { slug: string; url: string; uwaga: string }[] = [];

for (const pozycja of lista.pozycje) {
  const plik = join(katalogDanych, `${pozycja.slug}.json`);
  if (!existsSync(plik)) continue;

  if (planPozycji(pozycja.slug, rejestr) === 'reczny') {
    const wpis = rejestr.find((w) => w.slug === pozycja.slug)!;
    await odczekaj(1000);
    try {
      if (doPrzegladu(wpis, pobierz(wpis.url, 15))) {
        przeglad.push({ slug: pozycja.slug, url: wpis.url, uwaga: 'treść źródła zmieniona od daty odczytu' });
        console.log(`! ${pozycja.slug}: do przeglądu ręcznego (źródło zmienione)`);
      } else {
        bezZmian += 1;
      }
    } catch {
      przeglad.push({ slug: pozycja.slug, url: wpis.url, uwaga: 'źródło niedostępne przy odświeżaniu' });
    }
    continue;
  }

  const stary = parafiaSchema.parse(JSON.parse(readFileSync(plik, 'utf-8')));
  const urlKarty = `${pozycja.zrodlo.url}/${pozycja.id}`;
  await odczekaj(1000);
  let szczegoly;
  try {
    szczegoly = parsujKarteParafii(pobierz(urlKarty));
  } catch {
    pominiete += 1;
    console.log(`— ${pozycja.slug}: katalog niedostępny, bez zmian`);
    continue;
  }
  let wynikMszy = null;
  if (szczegoly?.www) {
    try {
      wynikMszy = await pobierzMszeZeZrodel(
        szczegoly.www,
        (url) => pobierz(url, 15),
        () => odczekaj(1000),
      );
    } catch {
      wynikMszy = null;
    }
  }
  const wynik = zbudujRekord({
    karta: { id: pozycja.id, nazwa: pozycja.nazwa, dekanat: '', miejscowosc: pozycja.miejscowosc },
    szczegoly,
    msze: wynikMszy?.msze ?? null,
    zrodloKatalogu: { url: urlKarty, dataOdczytu: dzis },
    zrodloStrony: wynikMszy ? { url: wynikMszy.url, dataOdczytu: dzis } : undefined,
    slug: pozycja.slug,
  });
  if (!('rekord' in wynik)) {
    pominiete += 1;
    console.log(`— ${pozycja.slug}: świeży odczyt poniżej progu (${wynik.wyjatek.przyczyna}), bez zmian`);
    continue;
  }
  const { rekord, zmieniono } = odswiezRekord(stary, wynik.rekord);
  if (zmieniono) {
    writeFileSync(plik, `${JSON.stringify(rekord, null, 2)}\n`);
    zmienione += 1;
    console.log(`✓ ${pozycja.slug}: zaktualizowano`);
  } else {
    bezZmian += 1;
  }
}

if (przeglad.length > 0) {
  const tresc = `# Rekordy ręczne do przeglądu — Gdańsk

Data: ${dzis} · generat: \`npm run dane:odswiez\` — rekord ręczny nigdy nie
jest nadpisywany automatycznie; poniższe wymagają ponownego odczytu
człowieka.

| Rekord | Źródło | Uwaga |
|---|---|---|
${przeglad.map((p) => `| ${p.slug} | ${p.url} | ${p.uwaga} |`).join('\n')}
`;
  writeFileSync(join(korzen, 'src/dane/raporty/gdansk-przeglad-reczny.md'), tresc);
}
console.log(
  `Zaktualizowane: ${zmienione}; bez zmian: ${bezZmian}; pominięte: ${pominiete}; do przeglądu ręcznego: ${przeglad.length}.`,
);
