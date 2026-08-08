// Próg wejścia do rankingu miejskiego z dokumentu 03: poniżej pięciu
// głosów parafia czeka poza zestawieniem — nigdy z pozycją.
export const PROG_RANKINGU = 5;

export type WpisRankingu = {
  slug: string;
  ocena: number;
  liczba: number;
};

export type PozycjaRankingu = WpisRankingu & { pozycja: number };

export type Ranking = {
  pozycje: PozycjaRankingu[];
  zaMaloGlosow: string[];
};

export function rankingMiejski(wpisy: readonly WpisRankingu[]): Ranking | null {
  const nadProgiem = wpisy
    .filter((w) => w.liczba >= PROG_RANKINGU)
    .sort((a, b) => b.ocena - a.ocena || a.slug.localeCompare(b.slug));
  if (nadProgiem.length === 0) return null;

  const pozycje = nadProgiem.map((wpis, i) => ({
    ...wpis,
    pozycja: i > 0 && wpis.ocena === nadProgiem[i - 1].ocena ? -1 : i + 1,
  }));
  for (let i = 1; i < pozycje.length; i += 1) {
    if (pozycje[i].pozycja === -1) pozycje[i].pozycja = pozycje[i - 1].pozycja;
  }

  return {
    pozycje,
    zaMaloGlosow: wpisy.filter((w) => w.liczba < PROG_RANKINGU).map((w) => w.slug),
  };
}
