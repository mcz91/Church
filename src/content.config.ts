import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { parafiaSchema } from './lib/parafie';

export const collections = {
  parafie: defineCollection({
    loader: glob({ pattern: '**/*.json', base: './src/dane/parafie' }),
    schema: parafiaSchema,
  }),
};
