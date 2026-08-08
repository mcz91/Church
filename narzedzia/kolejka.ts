import {
  CZAS,
  ETYKIETA_NIEDZIELI,
  ETYKIETA_TYGODNIA,
  bezTagow,
  znormalizujSup,
} from './etykiety.ts';
import { zbudujRekord } from './rekordy.ts';
import type { SzczegolyParafii } from './parser-archidiecezji.ts';
import type { Parafia } from '../src/lib/parafie.ts';

// Kolejka wyjątków ręcznych (docs/09, acc. 4): fragmenty-kandydaci są
// wybierani deterministycznie i są POMOCĄ — źródłem jest treść strony,
// którą człowiek czyta; zapis wyłącznie po jawnym potwierdzeniu,
// a każda potwierdzona godzina musi mieć pokrycie w treści źródła.

export type PozycjaKolejki = { id: string; nazwa: string; slug: string; www?: string };

export type Potwierdzenie = {
  pozycja: string;
  url: string;
  niedziela: string;
  tydzien?: string;
  spowiedz?: string;
};

export function kandydaci(html: string): string[] {
  const czysty = znormalizujSup(
    html
      .slice(Math.max(0, html.indexOf('</head>')))
      .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, ''),
  );
  const linie = czysty
    .split(/<(?:p|li|h[1-6]|div|br|td|tr)\b[^>]*\/?>|<\/(?:p|li|h[1-6]|div|td|tr)>/i)
    .map((b) => bezTagow(b).trim())
    .filter(
      (b) =>
        b.length > 0 &&
        b.length < 240 &&
        (CZAS.test(b) || ETYKIETA_NIEDZIELI.test(b) || ETYKIETA_TYGODNIA.test(b)),
    );
  return [...new Set(linie)].slice(0, 40);
}

// Każda godzina potwierdzonej wartości musi występować w treści strony
// w którymś z zapisów: 7:30, 7.30, 07:30, 7 30, 7<sup>30</sup>.
export function zawieraGodzine(html: string, wartosc: string): boolean {
  const tresc = znormalizujSup(html);
  const godziny = wartosc.match(/\d{1,2}:\d{2}/g) ?? [];
  return godziny.every((godzina) => {
    const [h, m] = godzina.split(':');
    const warianty = [...new Set([h, String(Number(h)), `0${Number(h)}`])].flatMap((wh) => [
      `${wh}:${m}`,
      `${wh}.${m}`,
      `${wh} ${m}`,
    ]);
    return warianty.some((w) => tresc.includes(w));
  });
}

export type WynikKolejki = {
  podglad: { pozycja: string; nazwa: string; url?: string; kandydaci: string[] }[];
  zapisane: string[];
  rekordy: Parafia[];
  odrzucone: { pozycja: string; powod: string }[];
};

export function przetworzKolejke(opcje: {
  pozycje: PozycjaKolejki[];
  potwierdzenia: Potwierdzenie[] | null;
  pobierz: (url: string) => string;
  pobierzKarte: (id: string) => SzczegolyParafii | null;
  zapisz: (slug: string, rekord: Parafia) => void;
  dataOdczytu: string;
  miasto?: { nazwa: string; slug: string };
}): WynikKolejki {
  const wynik: WynikKolejki = { podglad: [], zapisane: [], rekordy: [], odrzucone: [] };

  if (opcje.potwierdzenia === null) {
    // Tryb nieinteraktywny: wyłącznie podgląd — żadnego pliku.
    for (const pozycja of opcje.pozycje) {
      let linie: string[] = [];
      if (pozycja.www) {
        try {
          linie = kandydaci(opcje.pobierz(pozycja.www));
        } catch {
          linie = [];
        }
      }
      wynik.podglad.push({ pozycja: pozycja.id, nazwa: pozycja.nazwa, url: pozycja.www, kandydaci: linie });
    }
    return wynik;
  }

  for (const potwierdzenie of opcje.potwierdzenia) {
    const pozycja = opcje.pozycje.find((p) => p.id === potwierdzenie.pozycja);
    if (!pozycja) {
      wynik.odrzucone.push({ pozycja: potwierdzenie.pozycja, powod: 'pozycja spoza raportu braków' });
      continue;
    }
    let tresc: string;
    try {
      tresc = opcje.pobierz(potwierdzenie.url);
    } catch {
      wynik.odrzucone.push({ pozycja: pozycja.id, powod: 'strona źródłowa niedostępna przy zapisie' });
      continue;
    }
    const wartosci = [potwierdzenie.niedziela, potwierdzenie.tydzien, potwierdzenie.spowiedz].filter(
      (w): w is string => Boolean(w),
    );
    if (!wartosci.every((w) => zawieraGodzine(tresc, w))) {
      wynik.odrzucone.push({
        pozycja: pozycja.id,
        powod: 'wartość bez pokrycia w treści strony źródłowej',
      });
      continue;
    }
    const szczegoly = opcje.pobierzKarte(pozycja.id);
    const budowa = zbudujRekord({
      karta: { id: pozycja.id, nazwa: pozycja.nazwa, dekanat: '', miejscowosc: '' },
      szczegoly,
      msze: {
        niedziela: potwierdzenie.niedziela,
        ...(potwierdzenie.tydzien ? { tydzien: potwierdzenie.tydzien } : {}),
        ...(potwierdzenie.spowiedz ? { spowiedz: potwierdzenie.spowiedz } : {}),
      },
      zrodloKatalogu: {
        url: `https://www.diecezja.gda.pl/parafie/${pozycja.id}`,
        dataOdczytu: opcje.dataOdczytu,
      },
      zrodloStrony: { url: potwierdzenie.url, dataOdczytu: opcje.dataOdczytu },
      slug: pozycja.slug,
      miasto: opcje.miasto,
      nazwaZrodlaStrony: 'strona parafii (odczyt ręczny)',
    });
    if ('rekord' in budowa) {
      opcje.zapisz(pozycja.slug, budowa.rekord);
      wynik.zapisane.push(pozycja.slug);
      wynik.rekordy.push(budowa.rekord);
    } else {
      wynik.odrzucone.push({ pozycja: pozycja.id, powod: budowa.wyjatek.przyczyna });
    }
  }
  return wynik;
}
