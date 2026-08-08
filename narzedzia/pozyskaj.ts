import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listaBazowaSchema } from '../src/lib/lista-bazowa.ts';
import type { ListaBazowa } from '../src/lib/lista-bazowa.ts';
import { odczekaj, pobierz } from './pobieranie.ts';
import { pobierzMszeZeZrodel } from './msze-zrodla.ts';
import { kartyMiasta, parsujIndeksKatalogu, parsujKarteParafii } from './parser-archidiecezji.ts';
import { slugify, zbudujRekord } from './rekordy.ts';
import type { Wyjatek } from './rekordy.ts';

// Pozyskanie danych Gdańska: katalog archidiecezji (adres, kontakt) +
// strona parafii na silniku ISP (godziny mszy) jako źródło wtórne
// o jednoznacznej strukturze. Rekord poniżej progu jakości nie wchodzi
// do danych — ląduje w raporcie wyjątków z przyczyną źródłową.

const INDEKS_URL = 'https://www.diecezja.gda.pl/parafie';
const MIASTO = { nazwa: 'Gdańsk', slug: 'gdansk' };
const ODSTEP_MS = 1000;

const korzen = fileURLToPath(new URL('..', import.meta.url));
const katalogDanych = join(korzen, 'src/dane/parafie/gdansk');
const katalogRaportow = join(korzen, 'src/dane/raporty');
const dzis = new Date().toISOString().slice(0, 10);

const POZA_MIANOWNIKIEM =
  'Lista obejmuje parafie rzymskokatolickie miasta Gdańska z katalogu Archidiecezji ' +
  'Gdańskiej. Publiczne katalogi innych wyznań obecnych w Gdańsku (m.in. ' +
  'ewangelicko-augsburskiego i prawosławnego) istnieją, ale nie są jeszcze włączone ' +
  'do mianownika — pokrycie liczone wobec tej listy nie obejmuje tych wspólnot ' +
  '(dług odnotowany w PAMIEC_OPERACYJNA.md). Wspólnoty bez publicznego katalogu ' +
  'wyznania pozostają poza listą.';

console.log(`Pobieram indeks katalogu: ${INDEKS_URL}`);
const indeks = pobierz(INDEKS_URL);
const karty = kartyMiasta(parsujIndeksKatalogu(indeks), MIASTO.nazwa).sort((a, b) =>
  a.nazwa.localeCompare(b.nazwa, 'pl'),
);
console.log(`Kart parafii w mieście ${MIASTO.nazwa}: ${karty.length}`);

// Slugi nadaje lista bazowa — przy kolizji patrona dołącza dzielnicę.
const zajete = new Map<string, number>();
const slugi = new Map<string, string>();
for (const karta of karty) {
  let slug = slugify(karta.nazwa);
  if (zajete.has(slug)) {
    slug = `${slug}-${slugify(karta.miejscowosc.replace(/^Gdańsk\s*/, '') || String(zajete.get(slug)))}`;
  }
  zajete.set(slugify(karta.nazwa), (zajete.get(slugify(karta.nazwa)) ?? 0) + 1);
  slugi.set(karta.id, slug);
}

const lista: ListaBazowa = {
  miasto: MIASTO.nazwa,
  miastoSlug: MIASTO.slug,
  pozaMianownikiem: POZA_MIANOWNIKIEM,
  pozycje: karty.map((karta) => ({
    id: karta.id,
    nazwa: karta.nazwa,
    wyznanie: 'rzymskokatolicka',
    miejscowosc: karta.miejscowosc,
    slug: slugi.get(karta.id)!,
    zrodlo: { nazwa: 'Archidiecezja Gdańska, katalog parafii', url: INDEKS_URL },
    dataOdczytu: dzis,
  })),
};
listaBazowaSchema.parse(lista);
mkdirSync(join(korzen, 'src/dane/lista-bazowa'), { recursive: true });
writeFileSync(join(korzen, 'src/dane/lista-bazowa/gdansk.json'), `${JSON.stringify(lista, null, 2)}\n`);
console.log('Lista bazowa zapisana.');

mkdirSync(katalogDanych, { recursive: true });
mkdirSync(katalogRaportow, { recursive: true });

const wyjatki: Wyjatek[] = [];
let zapisane = 0;

for (const karta of karty) {
  const urlKarty = `https://www.diecezja.gda.pl/parafie/${karta.id}`;
  await odczekaj(ODSTEP_MS);
  let szczegoly;
  try {
    szczegoly = parsujKarteParafii(pobierz(urlKarty));
  } catch {
    wyjatki.push({ pozycja: karta.id, nazwa: karta.nazwa, przyczyna: 'katalog niedostępny (błąd pobrania karty)' });
    continue;
  }

  let msze = null;
  let zrodloStrony;
  let stanStrony = 'katalog nie podaje strony www parafii';
  if (szczegoly?.www) {
    try {
      const wynikMszy = await pobierzMszeZeZrodel(
        szczegoly.www,
        (url) => pobierz(url, 15),
        () => odczekaj(ODSTEP_MS),
      );
      msze = wynikMszy?.msze ?? null;
      stanStrony = wynikMszy
        ? 'ok'
        : `strona parafii (${szczegoly.www}) bez jednoznacznej struktury porządku mszy`;
      if (wynikMszy) zrodloStrony = { url: wynikMszy.url, dataOdczytu: dzis };
    } catch {
      msze = null;
      stanStrony = `strona parafii (${szczegoly.www}) niedostępna — błąd pobrania`;
    }
  }

  const wynik = zbudujRekord({
    karta,
    szczegoly,
    msze,
    zrodloKatalogu: { url: urlKarty, dataOdczytu: dzis },
    zrodloStrony,
    slug: slugi.get(karta.id)!,
    miasto: MIASTO,
  });
  if ('rekord' in wynik) {
    writeFileSync(
      join(katalogDanych, `${wynik.rekord.slug}.json`),
      `${JSON.stringify(wynik.rekord, null, 2)}\n`,
    );
    zapisane += 1;
    console.log(`✓ ${wynik.rekord.slug}`);
  } else {
    const wyjatek =
      szczegoly && !msze
        ? {
            ...wynik.wyjatek,
            przyczyna: `poniżej progu jakości: brak godzin mszy niedzielnych — katalog ich nie publikuje, a ${stanStrony}`,
          }
        : wynik.wyjatek;
    wyjatki.push(wyjatek);
    console.log(`— ${karta.nazwa}: ${wyjatek.przyczyna}`);
  }
}

writeFileSync(
  join(katalogRaportow, 'gdansk-wyjatki.json'),
  `${JSON.stringify({ dataGeneracji: dzis, zrodloIndeksu: INDEKS_URL, wyjatki }, null, 2)}\n`,
);
console.log(`Zapisane karty: ${zapisane}/${karty.length}; wyjątki: ${wyjatki.length}.`);
console.log('Raport pokrycia: npm run dane:pokrycie');
