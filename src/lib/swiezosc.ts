import type { Fakt, Os } from './parafie.ts';

// Stopka zaufania (docs/13 akc. 9): data ostatniej zmiany danych wynika
// wyłącznie z plików wchodzących do builda — z zegara nie wolno jej
// brać, bo rosłaby przy każdym przebudowaniu, choć żaden fakt by się
// nie ruszył, a to byłoby kłamstwo o świeżości.
type Zrodlowa = {
  adres: Fakt;
  osie: Partial<Record<Os, Fakt>>;
  zdjecie?: { dataPobrania: string };
};

export function dataOstatniejZmiany(parafie: Zrodlowa[]): string | null {
  const daty: string[] = [];
  for (const parafia of parafie) {
    daty.push(parafia.adres.dataOdczytu);
    for (const fakt of Object.values(parafia.osie)) if (fakt) daty.push(fakt.dataOdczytu);
    if (parafia.zdjecie) daty.push(parafia.zdjecie.dataPobrania);
  }
  // Zapis ISO porządkuje się leksykograficznie, więc maksimum tekstowe
  // jest maksimum chronologicznym.
  return daty.length > 0 ? daty.reduce((a, b) => (a > b ? a : b)) : null;
}
