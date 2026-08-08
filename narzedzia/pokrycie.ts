// Raport pokrycia listy bazowej (dokument 07, decyzja 1): odsetek
// pozycji z kartą nad progiem jakości; każdy brak z przyczyną źródłową.

export type PozycjaPokrycia = { id: string; nazwa: string; slug: string };

export type Brak = { pozycja: string; nazwa: string; przyczyna: string };

export type RaportPokrycia = {
  mianownik: number;
  nadProgiem: number;
  procent: number;
  braki: Brak[];
};

export function policzPokrycie(
  pozycje: readonly PozycjaPokrycia[],
  slugiKart: ReadonlySet<string>,
  wyjatki: readonly { pozycja: string; przyczyna: string }[],
): RaportPokrycia {
  const braki: Brak[] = [];
  let nadProgiem = 0;
  for (const pozycja of pozycje) {
    if (slugiKart.has(pozycja.slug)) {
      nadProgiem += 1;
    } else {
      braki.push({
        pozycja: pozycja.id,
        nazwa: pozycja.nazwa,
        przyczyna:
          wyjatki.find((w) => w.pozycja === pozycja.id)?.przyczyna ??
          'przyczyna niezarejestrowana w raporcie wyjątków',
      });
    }
  }
  const mianownik = pozycje.length;
  return {
    mianownik,
    nadProgiem,
    procent: mianownik === 0 ? 0 : Math.round((1000 * nadProgiem) / mianownik) / 10,
    braki,
  };
}
