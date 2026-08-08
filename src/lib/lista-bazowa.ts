import { z } from 'astro/zod';
import { SLUG } from './parafie.ts';

// Lista bazowa miasta — mianownik pokrycia (dokument 07, decyzja 1):
// wyłącznie pozycje z oficjalnych, publicznych katalogów wyznań, każda
// ze źródłem i datą odczytu; wspólnoty bez katalogu jawnie poza listą.
const pozycjaSchema = z
  .object({
    id: z.string().min(1),
    nazwa: z.string().min(1),
    wyznanie: z.string().min(1),
    miejscowosc: z.string().min(1),
    slug: z.string().regex(SLUG),
    zrodlo: z.object({ nazwa: z.string().min(1), url: z.url() }).strict(),
    dataOdczytu: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .strict();

export const listaBazowaSchema = z
  .object({
    miasto: z.string().min(1),
    miastoSlug: z.string().regex(SLUG),
    pozaMianownikiem: z.string().min(1),
    pozycje: z.array(pozycjaSchema),
  })
  .strict();

export type ListaBazowa = z.infer<typeof listaBazowaSchema>;
export type PozycjaListy = ListaBazowa['pozycje'][number];
