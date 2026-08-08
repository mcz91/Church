// Ocena jako pięć kropek z ułamkowym wypełnieniem ostatniej (dokument 01):
// 4,6 = cztery pełne + jedna wypełniona w 60%.
export type Kropki = {
  pelne: number;
  czesc: number;
  puste: number;
};

export function kropki(ocena: number): Kropki {
  const pelne = Math.floor(ocena + 1e-9);
  const czesc = Math.round((ocena - pelne) * 100);
  return { pelne, czesc, puste: 5 - pelne - (czesc > 0 ? 1 : 0) };
}
