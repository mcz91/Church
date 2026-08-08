import type { Glos, Wymiar } from './glosy';
import { WYMIARY } from './glosy';

// Jedyna droga do agregatów: wybór głosów dokładnie jednej parafii.
// Typ wymusza pojedynczą parafię, a konstruktor przepuszcza wyłącznie
// głosy approved — publikacja przed moderacją nie istnieje.
export type GlosyJednejParafii = {
  parafiaSlug: string;
  glosy: readonly Glos[];
};

export function glosyParafii(parafiaSlug: string, glosy: readonly Glos[]): GlosyJednejParafii {
  return {
    parafiaSlug,
    glosy: glosy.filter((g) => g.parafiaSlug === parafiaSlug && g.status === 'approved'),
  };
}

export type Agregaty = {
  liczba: number;
  ogolna: number;
  wymiary: Record<Wymiar, number>;
};

function srednia(liczby: readonly number[]): number {
  const suma = liczby.reduce((a, b) => a + b, 0);
  return Math.round((suma / liczby.length) * 10) / 10;
}

export function policzAgregaty({ glosy }: GlosyJednejParafii): Agregaty | null {
  if (glosy.length === 0) return null;
  const wymiary = Object.fromEntries(
    (Object.keys(WYMIARY) as Wymiar[]).map((w) => [w, srednia(glosy.map((g) => g.wymiary[w]))]),
  ) as Record<Wymiar, number>;
  return {
    liczba: glosy.length,
    ogolna: srednia(glosy.map((g) => g.ocenaOgolna)),
    wymiary,
  };
}
