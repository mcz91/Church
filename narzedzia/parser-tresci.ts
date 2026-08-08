import {
  CZAS,
  ETYKIETA_NIEDZIELI,
  ETYKIETA_TYGODNIA,
  bezTagow,
  normalizujGodziny,
  znormalizujSup,
} from './etykiety.ts';

// Deterministyczne parsery podstron mszy dwóch najliczniejszych silników
// spoza ISP (raport silników: WordPress, Joomla). Model blokowy: treść
// znanego kontenera dzielona na bloki (akapity, linie <br>, pozycje list,
// nagłówki); etykieta z zamkniętego zbioru otwiera oś, wartości zbierane
// są wyłącznie z kolejnych bloków niosących godziny — pierwszy blok bez
// godziny zamyka oś, więc prozy i sąsiednich sekcji nie da się połknąć.

const KONTENERY_WORDPRESS = ['entry-content', 'post-content', 'fusion-text'];
const KONTENERY_JOOMLA = ['itemBody', 'item-page', 'articleBody'];

export type MszeTresci = { niedziela: string; tydzien?: string };

function bloki(html: string, kontenery: string[]): string[] | null {
  const odGlowy = html.slice(Math.max(0, html.indexOf('</head>')));
  const czysty = znormalizujSup(
    odGlowy.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, '').replace(/<!--[\s\S]*?-->/g, ''),
  );
  const start = kontenery
    .map((k) => czysty.indexOf(k))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b)[0];
  if (start === undefined) return null;
  return czysty
    .slice(start)
    .split(/<(?:p|li|h[1-6]|div|br)\b[^>]*\/?>|<\/(?:p|li|h[1-6]|div)>/i)
    .map((b) => bezTagow(b).replace(/^[-–•\s]+/, '').trim())
    .filter((b) => b.length > 0);
}

// „Niedziele/Sunday" → „Niedziele"; etykieta czysta bez dwukropka.
const czystaEtykieta = (blok: string) => blok.split('/')[0].replace(/:\s*$/, '').trim();

function typEtykiety(tekst: string): 'niedziela' | 'tydzien' | null {
  if (ETYKIETA_NIEDZIELI.test(tekst)) return 'niedziela';
  if (ETYKIETA_TYGODNIA.test(tekst)) return 'tydzien';
  return null;
}

function parsujBloki(listaBlokow: string[]): MszeTresci | null {
  const osie: { niedziela?: string; tydzien?: string } = {};
  for (let i = 0; i < listaBlokow.length; i += 1) {
    const blok = listaBlokow[i];
    let typ = typEtykiety(czystaEtykieta(blok));
    let wartosc: string | null = null;

    if (typ === null && blok.includes(':')) {
      // etykieta inline: „Dni powszednie: 18.00"
      const [przed, ...reszta] = blok.split(':');
      const kandydat = typEtykiety(czystaEtykieta(przed));
      if (kandydat) {
        typ = kandydat;
        wartosc = normalizujGodziny(reszta.join(':'));
        if (!wartosc) typ = null;
      }
    } else if (typ !== null) {
      const zebrane: string[] = [];
      for (let j = i + 1; j < listaBlokow.length; j += 1) {
        const nastepny = listaBlokow[j];
        if (!CZAS.test(nastepny) || typEtykiety(czystaEtykieta(nastepny))) break;
        zebrane.push(nastepny);
      }
      wartosc = zebrane.length > 0 ? normalizujGodziny(zebrane.join(', ')) : null;
    }

    if (typ && wartosc && !osie[typ]) osie[typ] = wartosc;
  }
  if (!osie.niedziela) return null;
  return { niedziela: osie.niedziela, ...(osie.tydzien ? { tydzien: osie.tydzien } : {}) };
}

export function parsujMszeWordPress(html: string): MszeTresci | null {
  const listaBlokow = bloki(html, KONTENERY_WORDPRESS);
  return listaBlokow ? parsujBloki(listaBlokow) : null;
}

export function parsujMszeJoomla(html: string): MszeTresci | null {
  const listaBlokow = bloki(html, KONTENERY_JOOMLA);
  return listaBlokow ? parsujBloki(listaBlokow) : null;
}

// Menu strony wskazuje podstronę mszy: link z „msz…" w adresie,
// z pominięciem porządków sezonowych i intencji.
const WYKLUCZENIA = /wakac|letni|zimow|intencj|gregoriansk|koled|kolęd/i;

export function znajdzPodstroneMszy(html: string): string | null {
  for (const [, href] of html.matchAll(/<a[^>]+href="([^"#]+)"[^>]*>/g)) {
    if (/msz[aey]/i.test(href) && !WYKLUCZENIA.test(href)) return href;
  }
  return null;
}
