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

export const parafiaSchema = z.object({
  nazwa: z.string().min(1),
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
    const n = niedziela.wartosc.split('·').length;
    w.push(`${n} ${odmianaMszy(n)} w niedzielę`);
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
