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
