import { LICENCJA_WOLNA } from '../src/lib/parafie.ts';
import type { Parafia } from '../src/lib/parafie.ts';

// Wizytówki kościołów z Wikimedia Commons (docs/11): automat wyszukuje
// kandydatów i czyta autor/licencję wyłącznie z extmetadata API; brak
// pól = kandydat odpada. Dopasowanie do właściwego kościoła potwierdza
// człowiek — pomyłka budynku to szkoda tej klasy, co błędne godziny
// mszy. Tryb nieinteraktywny niczego nie zapisuje.

type StronaCommons = {
  title?: string;
  imageinfo?: {
    url?: string;
    thumburl?: string;
    descriptionurl?: string;
    extmetadata?: Record<string, { value?: string }>;
  }[];
};

export type KandydatWizytowki = {
  tytul: string;
  miniatura: string;
  opisUrl: string;
  autor: string;
  licencja: string;
  opis: string;
};

const czystyTekst = (html: string): string =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&nbsp;', ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function kandydaciCommons(odpowiedz: Record<string, unknown>): {
  kandydaci: KandydatWizytowki[];
  odrzuceni: { tytul: string; przyczyna: string }[];
} {
  const strony = Object.values(
    ((odpowiedz as { query?: { pages?: Record<string, StronaCommons> } }).query?.pages ?? {}),
  );
  const kandydaci: KandydatWizytowki[] = [];
  const odrzuceni: { tytul: string; przyczyna: string }[] = [];
  for (const strona of strony) {
    const tytul = strona.title ?? '(bez tytułu)';
    const info = strona.imageinfo?.[0];
    if (!info?.thumburl || !info.descriptionurl) {
      odrzuceni.push({ tytul, przyczyna: 'brak informacji o pliku w odpowiedzi API' });
      continue;
    }
    const meta = info.extmetadata ?? {};
    const autor = czystyTekst(meta.Artist?.value ?? '');
    const licencja = czystyTekst(meta.LicenseShortName?.value ?? '');
    if (!autor || !licencja) {
      odrzuceni.push({ tytul, przyczyna: 'brak pól autor/licencja w extmetadata' });
      continue;
    }
    if (!LICENCJA_WOLNA.test(licencja)) {
      odrzuceni.push({ tytul, przyczyna: `licencja poza listą wolnych: ${licencja}` });
      continue;
    }
    kandydaci.push({
      tytul,
      miniatura: info.thumburl,
      opisUrl: info.descriptionurl,
      autor,
      licencja,
      opis: czystyTekst(meta.ImageDescription?.value ?? ''),
    });
  }
  return { kandydaci, odrzuceni };
}

export type PozycjaWizytowki = { slug: string; nazwa: string; miasto: string };

// Wyszukiwanie po wezwaniu i mieście — formalna nazwa parafii jest dla
// wyszukiwarki Commons za wąska; pliki opisują budynek („kościół …").
export function zapytanieOWizytowke(nazwa: string, miasto: string): string {
  const wezwanie = nazwa.replace(/^Parafia( katedralna| rzymskokatolicka)*( pw\.)?\s*/i, '');
  return `kościół ${wezwanie} ${miasto}`;
}

// Commons serwuje renderowania tylko w koszyku standardowych
// szerokości — 1600 px w nim nie ma (URL /1600px- zwraca stronę
// błędu), a API na iiurlwidth spoza koszyka wskazuje najbliższy
// szerszy render (1920 px). Kontrakt wymaga ≤1600 px: miniatury
// szersze sprowadzamy do koszykowego renderu 1280 px.
export function renderDo1600(url: string): string {
  return url.replace(/\/(\d+)px-/, (calosc, szerokosc: string) =>
    Number(szerokosc) > 1600 ? '/1280px-' : calosc,
  );
}

export type PotwierdzenieWizytowki = { slug: string; tytulPliku: string; alt: string };

export type WynikWizytowek = {
  podglad: { slug: string; nazwa: string; kandydaci: KandydatWizytowki[]; odrzuceni: { tytul: string; przyczyna: string }[] }[];
  zapisane: string[];
  odrzucone: { slug: string; powod: string }[];
};

export function przetworzWizytowki(opcje: {
  parafie: PozycjaWizytowki[];
  potwierdzenia: PotwierdzenieWizytowki[] | null;
  szukaj: (zapytanie: string) => Record<string, unknown>;
  pobierzInfo: (tytulPliku: string) => StronaCommons | null;
  pobierzObraz: (url: string) => Buffer;
  zapiszObraz: (plik: string, dane: Buffer) => void;
  zapiszRekord: (slug: string, zdjecie: NonNullable<Parafia['zdjecie']>) => void;
  dataPobrania: string;
}): WynikWizytowek {
  const wynik: WynikWizytowek = { podglad: [], zapisane: [], odrzucone: [] };

  if (opcje.potwierdzenia === null) {
    for (const parafia of opcje.parafie) {
      const { kandydaci, odrzuceni } = kandydaciCommons(
        opcje.szukaj(zapytanieOWizytowke(parafia.nazwa, parafia.miasto)),
      );
      wynik.podglad.push({ slug: parafia.slug, nazwa: parafia.nazwa, kandydaci, odrzuceni });
    }
    return wynik;
  }

  for (const potwierdzenie of opcje.potwierdzenia) {
    const parafia = opcje.parafie.find((p) => p.slug === potwierdzenie.slug);
    if (!parafia) {
      wynik.odrzucone.push({ slug: potwierdzenie.slug, powod: 'slug spoza listy parafii' });
      continue;
    }
    const strona = opcje.pobierzInfo(potwierdzenie.tytulPliku);
    const { kandydaci, odrzuceni } = strona
      ? kandydaciCommons({ query: { pages: { potwierdzony: strona } } })
      : { kandydaci: [], odrzuceni: [{ tytul: potwierdzenie.tytulPliku, przyczyna: 'plik nieznaleziony w API' }] };
    const kandydat = kandydaci[0];
    if (!kandydat) {
      wynik.odrzucone.push({
        slug: potwierdzenie.slug,
        powod: odrzuceni[0]?.przyczyna ?? 'plik bez kompletu metadanych',
      });
      continue;
    }
    const rozszerzenie = (kandydat.miniatura.split('.').pop() ?? 'jpg').toLowerCase();
    const bezpieczne = ['jpg', 'jpeg', 'png', 'webp'].includes(rozszerzenie) ? rozszerzenie : 'jpg';
    const plik = `${parafia.slug}.${bezpieczne}`;
    opcje.zapiszObraz(plik, opcje.pobierzObraz(renderDo1600(kandydat.miniatura)));
    opcje.zapiszRekord(parafia.slug, {
      plik,
      alt: potwierdzenie.alt,
      autor: kandydat.autor,
      licencja: kandydat.licencja,
      zrodloUrl: kandydat.opisUrl,
      dataPobrania: opcje.dataPobrania,
    });
    wynik.zapisane.push(parafia.slug);
  }
  return wynik;
}
