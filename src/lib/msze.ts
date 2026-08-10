// Porządek mszy w rekordach jest wolnym tekstem ze źródła — obok
// godzin niesie dopiski sezonowe, godziny innych dni i zdania
// negujące. Wyszukiwarka „msza niedługo" pokazuje wyłącznie godziny
// pewne; pozycja dwuznaczna odpada i parafia po prostu nie pojawia się
// w wynikach. Błędna godzina mszy to szkoda tej samej klasy, co błędny
// adres — zgadywanie jest tu zakazane, a pełna wartość ze źródłem
// zostaje widoczna na karcie parafii.

// Zamknięte listy słownictwa zaobserwowanego w źródłach; poszerza je
// wyłącznie nowy, zweryfikowany przypadek — nigdy luźniejszy wzorzec.
// Data obowiązywania („Od stycznia 2025:", „od czasu COVID 19") opisuje
// stan bieżący, nie warunek, więc nie unieważnia godziny.
const WARUNEK =
  /wakac|lipc|lipiec|sierp|adwen|roraty|kolęd|kolend|wrześ|maja|czerwc|nie ma|tylko w|poza |wyjątk|anulowan|w okresie|uwaga/i;

const INNY_DZIEN = /sobot|dni powszednie|poniedział|piątk|wtorek|środ|czwart/i;

const GODZINA = /(\d{1,2})[:.](\d{2})/g;

export function naMinuty(godzina: string): number {
  const [g, m] = godzina.split(':');
  return Number(g) * 60 + Number(m);
}

export function godzinyPewne(wartosc: string): { pewne: string[]; odrzucone: string[] } {
  const trafienia = [...wartosc.matchAll(GODZINA)];
  const pewne = new Set<string>();
  const odrzucone = new Set<string>();

  for (const [i, trafienie] of trafienia.entries()) {
    const start = trafienie.index;
    const poprzednie = trafienia[i - 1];
    const nastepne = trafienia[i + 1];
    const przed = wartosc.slice(poprzednie ? poprzednie.index + poprzednie[0].length : 0, start);
    const po = wartosc.slice(start + trafienie[0].length, nastepne ? nastepne.index : wartosc.length);
    const godzina = `${Number(trafienie[1])}:${trafienie[2]}`;

    if (WARUNEK.test(przed) || WARUNEK.test(po) || INNY_DZIEN.test(przed)) odrzucone.add(godzina);
    else pewne.add(godzina);
  }

  // Ta sama godzina odrzucona choć raz jest niepewna w całym wpisie —
  // inaczej negacja („nie ma Mszy o 12:00") zostałaby zignorowana.
  for (const godzina of odrzucone) pewne.delete(godzina);

  const rosnaco = (a: string, b: string) => naMinuty(a) - naMinuty(b);
  return { pewne: [...pewne].sort(rosnaco), odrzucone: [...odrzucone].sort(rosnaco) };
}

export function wkrotce(
  godziny: string[],
  terazMinuty: number,
  oknoMinut: number,
): { godzina: string; za: number }[] {
  return godziny
    .map((godzina) => ({ godzina, za: naMinuty(godzina) - terazMinuty }))
    .filter((m) => m.za >= 0 && m.za <= oknoMinut)
    .sort((a, b) => a.za - b.za);
}
