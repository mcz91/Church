import { OSIE } from './parafie.ts';
import type { Fakt, Os } from './parafie.ts';

// Strony-filtry faktów (docs/13 akc. 3). Adresy pochodzą stąd, a nie
// z etykiet: etykieta jest tekstem do czytania i wolno ją poprawić,
// slug jest adresem i zmiana zepsułaby cudze linki.
// Filtr obiecujący konkret („msza z dziećmi") sprawdza treść osi —
// samo istnienie osi „msze szczególne" nie dowodzi udziału dzieci.
type Filtr = { slug: string; etykieta: string; zawiera?: RegExp };

export const FILTRY: Record<Os, Filtr> = {
  mszeNiedziela: { slug: 'msze-w-niedziele', etykieta: OSIE.mszeNiedziela },
  mszeTydzien: { slug: 'msze-w-tygodniu', etykieta: OSIE.mszeTydzien },
  spowiedz: { slug: 'spowiedz-poza-msza', etykieta: OSIE.spowiedz },
  dostepnosc: { slug: 'dostepnosc', etykieta: OSIE.dostepnosc },
  dojazd: { slug: 'dojazd', etykieta: OSIE.dojazd },
  muzyka: { slug: 'muzyka', etykieta: OSIE.muzyka },
  wspolnoty: { slug: 'wspolnoty-i-grupy', etykieta: OSIE.wspolnoty },
  mszeSzczegolne: {
    slug: 'msza-z-dziecmi',
    etykieta: 'Msza z udziałem dzieci',
    zawiera: /dzieci/i,
  },
  transmisja: { slug: 'transmisja-online', etykieta: OSIE.transmisja, zawiera: /^tak/i },
};

export function filtrPoSlugu(slug: string): Os | null {
  const wpis = Object.entries(FILTRY).find(([, filtr]) => filtr.slug === slug);
  return wpis ? (wpis[0] as Os) : null;
}

export function parafieFiltru<T extends { osie: Partial<Record<Os, Fakt>> }>(
  parafie: T[],
  os: Os,
): T[] {
  const filtr = FILTRY[os];
  return parafie.filter((parafia) => {
    const fakt = parafia.osie[os];
    if (!fakt) return false;
    return filtr.zawiera ? filtr.zawiera.test(fakt.wartosc) : true;
  });
}
