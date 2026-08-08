import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { parafiaSchema } from './lib/parafie';
import { glosSchema } from './lib/glosy';

// Katalogi danych są podmienialne środowiskowo wyłącznie po to, by test
// integracyjny budował na danych jawnie fikcyjnych; produkcja używa
// katalogów z repozytorium.
export const collections = {
  parafie: defineCollection({
    loader: glob({ pattern: '**/*.json', base: process.env.PARAFIE_DIR ?? './src/dane/parafie' }),
    schema: parafiaSchema,
  }),
  glosy: defineCollection({
    loader: glob({ pattern: '**/*.json', base: process.env.GLOSY_DIR ?? './src/dane/glosy' }),
    schema: glosSchema,
  }),
};
