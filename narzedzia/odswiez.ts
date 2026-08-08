import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listaBazowaSchema } from '../src/lib/lista-bazowa.ts';
import { parafiaSchema } from '../src/lib/parafie.ts';
import { odswiezRekord } from './odswiezanie.ts';
import { odczekaj, pobierz } from './pobieranie.ts';
import { parsujKarteParafii, parsujMszeISP } from './parser-archidiecezji.ts';
import { zbudujRekord } from './rekordy.ts';

// Odświeżenie danych Gdańska wobec żywych źródeł: zmiana wartości daje
// diff pliku z nową datą odczytu; niezmienione źródło nie daje niczego.
// Harmonogram uruchomień czeka na BRAK: hosting/CI — do tego czasu
// komenda lokalna.

const korzen = fileURLToPath(new URL('..', import.meta.url));
const katalogDanych = join(korzen, 'src/dane/parafie/gdansk');
const dzis = new Date().toISOString().slice(0, 10);

const lista = listaBazowaSchema.parse(
  JSON.parse(readFileSync(join(korzen, 'src/dane/lista-bazowa/gdansk.json'), 'utf-8')),
);

let zmienione = 0;
let bezZmian = 0;
let pominiete = 0;

for (const pozycja of lista.pozycje) {
  const plik = join(katalogDanych, `${pozycja.slug}.json`);
  if (!existsSync(plik)) continue;
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
  let msze = null;
  let zrodloStrony;
  if (szczegoly?.www) {
    await odczekaj(1000);
    try {
      msze = parsujMszeISP(pobierz(szczegoly.www, 15));
      if (msze) zrodloStrony = { url: szczegoly.www, dataOdczytu: dzis };
    } catch {
      msze = null;
    }
  }
  const wynik = zbudujRekord({
    karta: { id: pozycja.id, nazwa: pozycja.nazwa, dekanat: '', miejscowosc: pozycja.miejscowosc },
    szczegoly,
    msze,
    zrodloKatalogu: { url: urlKarty, dataOdczytu: dzis },
    zrodloStrony,
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

console.log(`Zaktualizowane: ${zmienione}; bez zmian: ${bezZmian}; pominięte: ${pominiete}.`);
