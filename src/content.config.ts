import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { parafiaSchema } from './lib/parafie';
import { glosSchema } from './lib/glosy';

// Katalogi danych są podmienialne środowiskowo wyłącznie po to, by test
// integracyjny budował na danych jawnie fikcyjnych; produkcja używa
// katalogów z repozytorium.
const katalogGlosow = process.env.GLOSY_DIR ?? './src/dane/glosy';

export const collections = {
  parafie: defineCollection({
    loader: glob({ pattern: '**/*.json', base: process.env.PARAFIE_DIR ?? './src/dane/parafie' }),
    schema: parafiaSchema,
  }),
  glosy: defineCollection({
    loader: glob({ pattern: '**/*.json', base: katalogGlosow }),
    // Głos approved wskazujący plik zdjęcia nieobecny w repo nie
    // przechodzi builda — obietnica obrazu bez pliku byłaby kłamstwem.
    schema: glosSchema.superRefine((glos, ctx) => {
      if (glos.status !== 'approved') return;
      for (const zdjecie of glos.zdjecia ?? []) {
        if (!existsSync(join(katalogGlosow, glos.parafiaSlug, zdjecie.plik))) {
          ctx.addIssue({
            code: 'custom',
            message: `zdjęcie ${zdjecie.plik} nie istnieje obok pliku głosu`,
          });
        }
      }
    }),
  }),
};
