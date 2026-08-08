// Jeden kanoniczny adres pary: slugi zawsze w porządku alfabetycznym,
// niezależnie od kolejności podania — UI nigdy nie generuje odwrotnego.
export function kanonicznaPara(a: string, b: string): [string, string] {
  if (a === b) throw new Error(`porównanie wymaga dwóch różnych parafii, podano dwukrotnie „${a}"`);
  return a < b ? [a, b] : [b, a];
}

export function sciezkaPorownania(a: string, b: string): string {
  const [pierwszy, drugi] = kanonicznaPara(a, b);
  return `/porownaj/${pierwszy}-vs-${drugi}`;
}
