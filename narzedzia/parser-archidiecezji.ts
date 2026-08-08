// Deterministyczne parsery katalogu parafii Archidiecezji Gdańskiej
// (www.diecezja.gda.pl) i stron parafialnych na silniku ISP
// (strony-parafialne.pl). Zero LLM w ścieżce prawdy (dokument 07):
// struktura nieparsowalna daje null, nigdy zgadywanie.

export type KartaKatalogu = {
  id: string;
  nazwa: string;
  dekanat: string;
  miejscowosc: string;
};

export type SzczegolyParafii = {
  wyznanie: string;
  patron: string;
  ulica: string;
  kodMiejscowosc: string;
  www?: string;
};

export type MszeISP = {
  niedziela: string;
  tydzien?: string;
  spowiedz?: string;
};

function odkoduj(tekst: string): string {
  return tekst
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&oacute;', 'ó')
    .replaceAll('&Oacute;', 'Ó')
    .replaceAll('&quot;', '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parsujIndeksKatalogu(html: string): KartaKatalogu[] {
  const karta =
    /<div class="shop-item parish[\s\S]*?<div class="category">([^<]*)<\/div>[\s\S]*?<a class="parish-name"[^>]*href="parafie\/(\d+)">([^<]*)<\/a>[\s\S]*?<div class="price">([^<]*)<\/div>/g;
  const wynik: KartaKatalogu[] = [];
  for (const [, dekanat, id, nazwa, miejscowosc] of html.matchAll(karta)) {
    wynik.push({
      id,
      nazwa: odkoduj(nazwa),
      dekanat: odkoduj(dekanat),
      miejscowosc: odkoduj(miejscowosc),
    });
  }
  return wynik;
}

export function kartyMiasta(karty: KartaKatalogu[], miasto: string): KartaKatalogu[] {
  return karty.filter((k) => k.miejscowosc === miasto || k.miejscowosc.startsWith(`${miasto} `));
}

export function parsujKarteParafii(html: string): SzczegolyParafii | null {
  const naglowek =
    /<div class="details-header">[\s\S]*?<h4>Parafia\s+(\S+)\s+pw\.\s*<\/h4>\s*<div class="item-price">([^<]*)<\/div>/.exec(
      html,
    );
  const adres = /<b>Adres:<\/b><br\s*\/?>\s*([^<]+?)<br\s*\/?>\s*([^<]+?)<br/.exec(html);
  if (!naglowek || !adres) return null;
  const www = /<b>Adres:<\/b>[\s\S]{0,900}?<a href="(https?:\/\/[^"]+)"[^>]*target="_blank">/.exec(
    html,
  );
  return {
    wyznanie: odkoduj(naglowek[1]),
    patron: odkoduj(naglowek[2]),
    ulica: odkoduj(adres[1]),
    kodMiejscowosc: odkoduj(adres[2]),
    ...(www ? { www: www[1] } : {}),
  };
}

// Normalizacja godzin: „7.30, 9.30, 11.00 (dla dzieci)" →
// „7:30 · 9:30 · 11:00 (dla dzieci)"; tekst bez ani jednej godziny jest
// wątpliwy i zwraca null (wyjątek, nie dane).
export function normalizujGodziny(tekst: string): string | null {
  const czysty = odkoduj(tekst).replace(/[,;\s]+$/, '');
  if (!/\d{1,2}[.:]\d{2}/.test(czysty)) return null;
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
    .map((c) => c.trim().replace(/(\d{1,2})\.(\d{2})/g, '$1:$2'))
    .filter((c) => c.length > 0)
    .join(' · ');
}

// Zamknięty zbiór etykiet porządku mszy — zakotwiczony ^…$, więc każdy
// kwalifikator w etykiecie (okres wakacyjny, zakres dat, kaplica) wyklucza
// segment zamiast być zgadywany.
const ETYKIETA_NIEDZIELI = /^(w\s+)?(msze\s+św\.?\s+w\s+)?niedziel[ea](\s+i\s+(święta|uroczystości))?$/i;
const ETYKIETA_TYGODNIA = /^(w\s+)?dni\s+powszednie$/i;
const ETYKIETA_SPOWIEDZI = /^spowied[źz]$/i;

const bezTagow = (fragment: string) => odkoduj(fragment.replace(/<[^>]+>/g, ' '));

export function parsujMszeISP(html: string): MszeISP | null {
  for (const [, blok] of html.matchAll(/<div class="gpg-service">([\s\S]*?)<\/div>/g)) {
    // Jednoznaczna struktura silnika ISP: etykieta w <strong>, wartości
    // w tekście do następnej etykiety albo końca akapitu.
    const segmenty = [
      ...blok.matchAll(/<strong[^>]*>([\s\S]*?)<\/strong>([\s\S]*?)(?=<strong|<\/p|$)/g),
    ].map(([, etykieta, wartosc]) => ({
      etykieta: bezTagow(etykieta).replace(/:\s*$/, '').trim(),
      wartosc: bezTagow(wartosc),
    }));

    let niedziela: string | null = null;
    let tydzien: string | null = null;
    let spowiedz: string | null = null;
    for (const segment of segmenty) {
      if (!niedziela && ETYKIETA_NIEDZIELI.test(segment.etykieta)) {
        niedziela = normalizujGodziny(segment.wartosc);
      } else if (!tydzien && ETYKIETA_TYGODNIA.test(segment.etykieta)) {
        tydzien = normalizujGodziny(segment.wartosc);
      } else if (!spowiedz && ETYKIETA_SPOWIEDZI.test(segment.etykieta)) {
        spowiedz = segment.wartosc.trim() || null;
      }
    }
    if (!niedziela) continue;
    return {
      niedziela,
      ...(tydzien ? { tydzien } : {}),
      ...(spowiedz ? { spowiedz } : {}),
    };
  }
  return null;
}
