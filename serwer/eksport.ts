import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { glosSchema } from '../src/lib/glosy.ts';
import type { Glos } from '../src/lib/glosy.ts';

// Publikacja przez repozytorium (dokument 04): approve materializuje głos
// jako plik danych <parafia>/<konto>.json — jedyna droga do builda.
export function eksportujGlos(katalog: string, glos: Glos): string {
  const zweryfikowany = glosSchema.parse(glos);
  const katalogParafii = join(katalog, zweryfikowany.parafiaSlug);
  mkdirSync(katalogParafii, { recursive: true });
  const sciezka = join(katalogParafii, `${zweryfikowany.autor.konto}.json`);
  writeFileSync(sciezka, `${JSON.stringify(zweryfikowany, null, 2)}\n`);
  return sciezka;
}

export function plikiAutora(katalog: string, konto: string): string[] {
  if (!existsSync(katalog)) return [];
  return readdirSync(katalog, { recursive: true, withFileTypes: true })
    .filter((wpis) => wpis.isFile() && wpis.name === `${konto}.json`)
    .map((wpis) => join(wpis.parentPath, wpis.name));
}

export function usunPlikiAutora(katalog: string, konto: string): string[] {
  const pliki = plikiAutora(katalog, konto);
  for (const plik of pliki) rmSync(plik);
  return pliki;
}
