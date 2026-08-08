// Rozpoznawanie silnika strony po sygnaturach w HTML — mianownik decyzji
// „które parsery pisać" (docs/09, acc. 2). Sygnatury zamknięte; strona
// bez trafienia jest jawnie „inna", nigdy zgadywana.
const SYGNATURY: [string, RegExp][] = [
  ['isp', /strony-parafialne/],
  ['wordpress', /wp-content|wp-includes|wp-json/],
  ['joomla', /\/media\/jui\/|com_content|content="Joomla/i],
  ['parafia-info', /parafia\.info\.pl/],
  ['wix', /wix\.com|wixstatic/],
  ['squarespace', /squarespace/],
  ['webnode', /webnode/],
  ['drupal', /content="Drupal|\/sites\/default\/files/],
];

export function rozpoznajSilnik(html: string): string {
  for (const [nazwa, wzorzec] of SYGNATURY) {
    if (wzorzec.test(html)) return nazwa;
  }
  return 'inny';
}
