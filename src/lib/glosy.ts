import { z } from 'astro/zod';
import { SLUG } from './parafie.ts';

// Zamknięta piątka wymiarów doświadczenia z dokumentu 03; rozszerzenie
// wymaga nowej wersji tamtego dokumentu, nie edycji danych.
export const WYMIARY = {
  przyjecie: 'Przyjęcie',
  muzyka: 'Muzyka',
  zDziecmi: 'Z dziećmi',
  dostepnosc: 'Dostępność',
  organizacja: 'Organizacja',
} as const;

export type Wymiar = keyof typeof WYMIARY;

export const STATUSY_MODERACJI = ['pending', 'approved', 'rejected'] as const;

export const EMAIL = /[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)+/i;

const ocena = z.number().int().min(1).max(5);

function tekstyPola(wartosc: unknown): string[] {
  if (typeof wartosc === 'string') return [wartosc];
  if (wartosc && typeof wartosc === 'object') return Object.values(wartosc).flatMap(tekstyPola);
  return [];
}

// Nazwa pliku zdjęcia jest pochodną identyfikatora głosu — nigdy
// oryginalną nazwą z aparatu (prywatność autora, docs/10 acc. 9).
const zdjecieSchema = z
  .object({
    plik: z.string().regex(/^[a-z0-9-]+-\d+\.(jpg|png)$/),
    alt: z.string().min(1),
    podpis: z.string().min(1).optional(),
  })
  .strict();

export type Zdjecie = z.infer<typeof zdjecieSchema>;

export const glosSchema = z
  .object({
    parafiaSlug: z.string().regex(SLUG),
    autor: z.object({ pseudonim: z.string().min(1), konto: z.string().min(1) }).strict(),
    status: z.enum(STATUSY_MODERACJI),
    zdjecia: z.array(zdjecieSchema).max(3).optional(),
    ocenaOgolna: ocena,
    wymiary: z
      .object({
        przyjecie: ocena,
        muzyka: ocena,
        zDziecmi: ocena,
        dostepnosc: ocena,
        organizacja: ocena,
      })
      .strict(),
    tekst: z.string().min(1).optional(),
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .strict()
  .superRefine((glos, ctx) => {
    // E-mail nigdy nie jest publiczny — w żadnym polu publikowanym.
    if (tekstyPola(glos).some((tekst) => EMAIL.test(tekst))) {
      ctx.addIssue({ code: 'custom', message: 'pole publikowane zawiera adres e-mail' });
    }
  });

export type Glos = z.infer<typeof glosSchema>;

export function miesiacGlosu(data: string): string {
  return new Intl.DateTimeFormat('pl', { month: 'long', year: 'numeric' }).format(
    new Date(`${data}T00:00:00Z`),
  );
}

export function liczbaZPrzecinkiem(liczba: number): string {
  return String(liczba).replace('.', ',');
}

// Zasady moderacji z dokumentu 03 — język opisujący, nie oceniający
// wyznań; jedno źródło dla formularza statycznego i serwisu zapisu.
export const ZASADY_MODERACJI =
  'Każdy głos czyta moderator-człowiek przed publikacją. Publikujemy głosy ' +
  'o własnym doświadczeniu; nie publikujemy mowy pogardy wobec wspólnot ' +
  'i wyznań, sporów doktrynalnych, danych osobowych osób trzecich ani ' +
  'treści spoza własnego doświadczenia. Publikowany jest wyłącznie pseudonim ' +
  '— adres e-mail nigdy.';

export function odmianaGlosow(n: number): string {
  if (n === 1) return 'głos';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) return 'głosy';
  return 'głosów';
}
