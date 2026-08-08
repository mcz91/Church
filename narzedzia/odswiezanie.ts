import { createHash } from 'node:crypto';
import { CZAS, bezTagow, znormalizujSup } from './etykiety.ts';
import type { Parafia } from '../src/lib/parafie.ts';
import type { Os } from '../src/lib/parafie.ts';

// Odświeżanie wobec świeżego odczytu źródła (dokument 07, decyzja 3):
// zmieniona wartość wchodzi z nową datą odczytu; wartość niezmieniona
// zostaje nietknięta (żadnego diffu), a oś nieobecna w świeżym odczycie
// nie znika — brak odczytu to nie dowód zniknięcia faktu.
export function odswiezRekord(
  istniejacy: Parafia,
  swiezy: Parafia,
): { rekord: Parafia; zmieniono: boolean } {
  let zmieniono = false;
  const rekord: Parafia = structuredClone(istniejacy);

  if (swiezy.adres.wartosc !== istniejacy.adres.wartosc) {
    rekord.adres = swiezy.adres;
    zmieniono = true;
  }
  if (swiezy.www && swiezy.www !== istniejacy.www) {
    rekord.www = swiezy.www;
    zmieniono = true;
  }
  for (const os of Object.keys(swiezy.osie) as Os[]) {
    const nowy = swiezy.osie[os];
    if (!nowy) continue;
    const stary = istniejacy.osie[os];
    if (!stary || stary.wartosc !== nowy.wartosc) {
      rekord.osie[os] = nowy;
      zmieniono = true;
    }
  }
  return { rekord, zmieniono };
}

// Rekordy ręczne (docs/09, acc. 5): rejestr trzyma odcisk linii
// godzinowych źródła z dnia odczytu; zmiana odcisku oznacza rekord
// „do przeglądu ręcznego" — nigdy automatyczne nadpisanie.
export type WpisRejestru = {
  slug: string;
  url: string;
  dataOdczytu: string;
  odcisk: string;
};

export function odciskZrodla(html: string): string {
  const czysty = znormalizujSup(
    html
      .slice(Math.max(0, html.indexOf('</head>')))
      .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, ''),
  );
  const linie = czysty
    .split(/<(?:p|li|h[1-6]|div|br|td|tr)\b[^>]*\/?>|<\/(?:p|li|h[1-6]|div|td|tr)>/i)
    .map((b) => bezTagow(b).trim())
    .filter((b) => b.length > 0 && CZAS.test(b));
  return createHash('sha256').update(linie.join('\n')).digest('hex');
}

export function doPrzegladu(wpis: WpisRejestru, htmlNowy: string): boolean {
  return odciskZrodla(htmlNowy) !== wpis.odcisk;
}

export function planPozycji(slug: string, rejestr: readonly WpisRejestru[]): 'reczny' | 'auto' {
  return rejestr.some((wpis) => wpis.slug === slug) ? 'reczny' : 'auto';
}
