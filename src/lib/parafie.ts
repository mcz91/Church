import { z } from 'astro/zod';

export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Zamknięta lista miast produktu (dokument 07, decyzja 6); rozszerzenie
// wymaga decyzji architektonicznej, nie edycji danych.
export const MIASTA = {
  torun: 'Toruń',
  gdansk: 'Gdańsk',
} as const;

const zrodloSchema = z.object({
  nazwa: z.string().min(1),
  url: z.url(),
});

export const faktSchema = z.object({
  wartosc: z.string().min(1),
  zrodlo: zrodloSchema,
  dataOdczytu: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type Fakt = z.infer<typeof faktSchema>;

// Zamknięta lista osi porównania z dokumentu 01; rozszerzenie wymaga
// zmiany tamtego dokumentu, nie edycji danych.
export const OSIE = {
  mszeNiedziela: 'Msze w niedzielę',
  mszeTydzien: 'Msze w tygodniu',
  spowiedz: 'Spowiedź poza mszą',
  dostepnosc: 'Dostępność',
  dojazd: 'Dojazd',
  muzyka: 'Muzyka',
  wspolnoty: 'Wspólnoty i grupy',
  mszeSzczegolne: 'Msze z dziećmi, w innych językach, PJM',
  transmisja: 'Transmisja online',
} as const;

export type Os = keyof typeof OSIE;

// Zamknięta lista wolnych licencji wizytówek (docs/11): domena
// publiczna / CC0 / CC BY / CC BY-SA w dowolnej wersji; NC i ND nigdy.
export const LICENCJA_WOLNA = /^(public domain|cc0(\s\S+)?|cc by(-sa)?\s\d\.\d(\s\S+)?)$/i;

const zdjecieWizytowkaSchema = z
  .object({
    plik: z.string().regex(/^[a-z0-9-]+\.(jpg|jpeg|png|webp)$/),
    alt: z.string().min(1),
    autor: z.string().min(1),
    licencja: z.string().regex(LICENCJA_WOLNA),
    zrodloUrl: z.url(),
    dataPobrania: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .strict();

// Położenie jest faktem ze źródłem jak każdy inny (OpenStreetMap,
// ODbL); zakres pilnuje, żeby błąd geokodera nie przeniósł parafii
// na drugą półkulę.
const polozenieSchema = z
  .object({
    szerokosc: z.number().min(49).max(55),
    dlugosc: z.number().min(14).max(24.2),
    zrodlo: zrodloSchema,
    dataOdczytu: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .strict();

export const parafiaSchema = z.object({
  nazwa: z.string().min(1),
  zdjecie: zdjecieWizytowkaSchema.optional(),
  polozenie: polozenieSchema.optional(),
  wyznanie: z.string().min(1),
  miasto: z.string().min(1),
  miastoSlug: z.string().regex(SLUG),
  slug: z.string().regex(SLUG),
  adres: faktSchema,
  www: z.url().optional(),
  osie: z
    .object({
      mszeNiedziela: faktSchema.optional(),
      mszeTydzien: faktSchema.optional(),
      spowiedz: faktSchema.optional(),
      dostepnosc: faktSchema.optional(),
      dojazd: faktSchema.optional(),
      muzyka: faktSchema.optional(),
      wspolnoty: faktSchema.optional(),
      mszeSzczegolne: faktSchema.optional(),
      transmisja: faktSchema.optional(),
    })
    .strict(),
});

export type Parafia = z.infer<typeof parafiaSchema>;

// Zamknięta lista cech do filtrowania listy startowej. Każda wynika
// wyłącznie z osi faktów (a więc ma źródło w rekordzie) — filtr nigdy
// nie sięga do ocen. Osie puste w danych (dostępność, transmisja,
// muzyka) nie dostają filtra, żeby nie budować martwego sterowania.
export const CECHY = {
  dzieci: 'Msza z udziałem dzieci',
  mlodziez: 'Msza dla młodzieży',
  spowiedz: 'Spowiedź poza mszą',
} as const;

export type Cecha = keyof typeof CECHY;

export function cechyParafii(parafia: { osie: Partial<Record<Os, Fakt>> }): Cecha[] {
  const opisMszy = [parafia.osie.mszeNiedziela?.wartosc, parafia.osie.mszeSzczegolne?.wartosc]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const cechy: Cecha[] = [];
  if (/dzieci|przedszkol|rodzinn/.test(opisMszy)) cechy.push('dzieci');
  if (/młodzież|młodzieżow|studen/.test(opisMszy)) cechy.push('mlodziez');
  if (parafia.osie.spowiedz) cechy.push('spowiedz');
  return cechy;
}

function odmianaMszy(n: number): string {
  if (n === 1) return 'msza';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) return 'msze';
  return 'mszy';
}

// Wyróżniki karty na stronie startowej — wyłącznie fakty wyprowadzone
// z osi rekordu, nigdy oceny.
export function wyrozniki(parafia: { osie: Partial<Record<Os, Fakt>> }): string[] {
  const w: string[] = [];
  const niedziela = parafia.osie.mszeNiedziela;
  if (niedziela) {
    // Liczą się godziny poza nawiasami — dopiski („16:00 w okresie
    // zimowym") nie są osobnymi mszami, a wartość bez separatorów nie
    // może udawać jednej mszy.
    const pozaNawiasami = niedziela.wartosc.replace(/\([^)]*\)/g, ' ');
    const n = (pozaNawiasami.match(/\d{1,2}[.:]\d{2}/g) ?? []).length;
    if (n > 0) w.push(`${n} ${odmianaMszy(n)} w niedzielę`);
  }
  if (parafia.osie.spowiedz) w.push('spowiedź także poza mszą');
  if (parafia.osie.mszeSzczegolne?.wartosc.toLowerCase().includes('dzieci')) {
    w.push('msza z udziałem dzieci');
  }
  if (parafia.osie.transmisja?.wartosc.toLowerCase().startsWith('tak')) {
    w.push('transmisja online');
  }
  return w.slice(0, 3);
}
