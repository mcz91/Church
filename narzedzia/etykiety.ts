// Wspólny słownik parserów źródeł: zamknięte zbiory etykiet porządku
// mszy (zakotwiczone ^…$ — kwalifikator w etykiecie wyklucza segment
// zamiast być zgadywany), odkodowanie encji i normalizacja godzin.
// Nowy wariant etykiety wchodzi wyłącznie ze zweryfikowanym fixture'em
// (pułapka w PAMIEC_OPERACYJNA.md), nigdy luźniejszym regexem.

export const CZAS = /\d{1,2}[.:]\d{2}/;

export const ETYKIETA_NIEDZIELI =
  /^(msze\s+św(ięte)?\.?\s+)?(w\s+)?niedziel[aeę](\s+i\s+(święta|uroczystości))?$/i;
export const ETYKIETA_TYGODNIA =
  /^((msze\s+św(ięte)?\.?\s+)?(w\s+)?dni\s+powszednie|od\s+poniedziałku\s+do\s+piątku)$/i;
export const ETYKIETA_SPOWIEDZI = /^spowied[źz]$/i;

export function odkoduj(tekst: string): string {
  return tekst
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&oacute;', 'ó')
    .replaceAll('&Oacute;', 'Ó')
    .replaceAll('&quot;', '"')
    .replaceAll('&#8211;', '–')
    .replaceAll('&bull;', ' ')
    .replaceAll('•', ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Teksty linków (przyciski „Więcej" itp.) to nawigacja, nie fakty.
export const bezTagow = (fragment: string) =>
  odkoduj(fragment.replace(/<a[\s>][\s\S]*?<\/a>/g, ' ').replace(/<[^>]+>/g, ' '));

export function normalizujGodziny(tekst: string): string | null {
  const czysty = odkoduj(tekst)
    .replace(/^godz\.?:?\s*/i, '')
    .replace(/[,;\s]+$/, '');
  if (!CZAS.test(czysty)) return null;
  const czesci: string[] = [];
  let biezaca = '';
  let nawiasy = 0;
  for (const znak of czysty) {
    if (znak === '(') nawiasy += 1;
    if (znak === ')') nawiasy = Math.max(0, nawiasy - 1);
    if ((znak === ',' || znak === ';') && nawiasy === 0) {
      czesci.push(biezaca);
      biezaca = '';
    } else {
      biezaca += znak;
    }
  }
  czesci.push(biezaca);
  return czesci
    // spójnik między dwiema godzinami („6.30 i 18.30") to też separator
    .flatMap((c) => c.split(/\s+i\s+(?=\d{1,2}[.:]\d{2})/))
    .map((c) =>
      c
        .trim()
        .replace(/(\d{1,2})\.(\d{2})/g, '$1:$2')
        .replace(/[.;,]+$/, '')
        .trim(),
    )
    .filter((c) => c.length > 0)
    .join(' · ');
}

// Minuty zapisane frakcją górną (6<sup>30</sup>) sprowadzamy do 6:30
// zanim znikną znaczniki.
export function znormalizujSup(html: string): string {
  return html.replace(/(\d{1,2})\s*<sup>\s*(\d{2})\s*<\/sup>/g, '$1:$2');
}
