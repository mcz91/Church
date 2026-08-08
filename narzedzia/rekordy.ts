import { parafiaSchema } from '../src/lib/parafie.ts';
import type { Parafia } from '../src/lib/parafie.ts';
import type { KartaKatalogu, MszeISP, SzczegolyParafii } from './parser-archidiecezji.ts';

export { normalizujGodziny } from './parser-archidiecezji.ts';

// Próg jakości z dokumentu 07: nazwa, wyznanie, adres i msze niedzielne
// — każdy fakt ze źródłem i datą. Rekord poniżej progu nie wchodzi do
// danych; ląduje w raporcie wyjątków z przyczyną źródłową.

export type Zrodlo = { url: string; dataOdczytu: string };

export type Wyjatek = { pozycja: string; nazwa: string; przyczyna: string };

export type WynikBudowy = { rekord: Parafia } | { wyjatek: Wyjatek };

const POLSKIE: Record<string, string> = {
  ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z',
};

export function slugify(tekst: string): string {
  return tekst
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (z) => POLSKIE[z] ?? z)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function zbudujRekord(wejscie: {
  karta: KartaKatalogu;
  szczegoly: SzczegolyParafii | null;
  msze: MszeISP | null;
  zrodloKatalogu: Zrodlo;
  zrodloStrony?: Zrodlo;
  slug?: string;
  miasto?: { nazwa: string; slug: string };
  nazwaZrodlaStrony?: string;
}): WynikBudowy {
  const { karta, szczegoly, msze, zrodloKatalogu, zrodloStrony } = wejscie;
  const miasto = wejscie.miasto ?? { nazwa: 'Gdańsk', slug: 'gdansk' };
  const wyjatek = (przyczyna: string): WynikBudowy => ({
    wyjatek: { pozycja: karta.id, nazwa: karta.nazwa, przyczyna },
  });

  if (!szczegoly) return wyjatek('karta katalogu nieczytelna (struktura nieparsowalna)');
  if (!msze || !zrodloStrony) {
    return wyjatek(
      'poniżej progu jakości: brak godzin mszy niedzielnych — katalog ich nie publikuje, ' +
        'a strona parafii jest niedostępna lub bez jednoznacznej struktury',
    );
  }

  const zrodloKarty = {
    nazwa: 'Archidiecezja Gdańska, katalog parafii',
    url: zrodloKatalogu.url,
  };
  const zrodloParafii = {
    nazwa: wejscie.nazwaZrodlaStrony ?? 'strona parafii',
    url: zrodloStrony.url,
  };
  const fakt = (wartosc: string, zrodlo: typeof zrodloKarty, dataOdczytu: string) => ({
    wartosc,
    zrodlo,
    dataOdczytu,
  });

  const kandydat: Parafia = {
    nazwa: `Parafia pw. ${szczegoly.patron}`,
    wyznanie: szczegoly.wyznanie,
    miasto: miasto.nazwa,
    miastoSlug: miasto.slug,
    slug: wejscie.slug ?? slugify(szczegoly.patron),
    adres: fakt(
      `${szczegoly.ulica}, ${szczegoly.kodMiejscowosc}`,
      zrodloKarty,
      zrodloKatalogu.dataOdczytu,
    ),
    ...(szczegoly.www ? { www: szczegoly.www } : {}),
    osie: {
      mszeNiedziela: fakt(msze.niedziela, zrodloParafii, zrodloStrony.dataOdczytu),
      ...(msze.tydzien ? { mszeTydzien: fakt(msze.tydzien, zrodloParafii, zrodloStrony.dataOdczytu) } : {}),
      ...(msze.spowiedz ? { spowiedz: fakt(msze.spowiedz, zrodloParafii, zrodloStrony.dataOdczytu) } : {}),
    },
  };

  const wynik = parafiaSchema.safeParse(kandydat);
  if (!wynik.success) {
    return wyjatek(`rekord nie przechodzi schematu parafii: ${wynik.error.issues[0]?.message}`);
  }
  return { rekord: wynik.data };
}
