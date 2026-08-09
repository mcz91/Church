import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { glosSchema } from '../src/lib/glosy.ts';
import type { Glos } from '../src/lib/glosy.ts';

// Publikacja przez repozytorium (dokument 04): approve materializuje głos
// jako plik danych <parafia>/<konto>.json — jedyna droga do builda.
export function eksportujGlos(
  katalog: string,
  glos: Glos,
  obrazy: { zrodlo: string; plik: string }[] = [],
): string {
  const zweryfikowany = glosSchema.parse(glos);
  const katalogParafii = join(katalog, zweryfikowany.parafiaSlug);
  mkdirSync(katalogParafii, { recursive: true });
  // Zdjęcia publikowane wchodzą do repo obok pliku głosu (dokument 04:
  // publikacja przez repo jak wszystko) — kopiowane bajt w bajt.
  for (const obraz of obrazy) {
    writeFileSync(join(katalogParafii, obraz.plik), readFileSync(obraz.zrodlo));
  }
  const sciezka = join(katalogParafii, `${zweryfikowany.autor.konto}.json`);
  writeFileSync(sciezka, `${JSON.stringify(zweryfikowany, null, 2)}\n`);
  return sciezka;
}

// Pliki autora w katalogu publikowanym: głos (<konto>.json) i obrazy
// (<konto>-N.jpg/png) — identyfikator konta jest jedynym kluczem nazw.
export function plikiAutora(katalog: string, konto: string): string[] {
  if (!existsSync(katalog)) return [];
  return readdirSync(katalog, { recursive: true, withFileTypes: true })
    .filter(
      (wpis) =>
        wpis.isFile() &&
        (wpis.name === `${konto}.json` ||
          (wpis.name.startsWith(`${konto}-`) &&
            /^-\d+\.(jpg|png)$/.test(wpis.name.slice(konto.length)))),
    )
    .map((wpis) => join(wpis.parentPath, wpis.name));
}

export function usunPlikiAutora(katalog: string, konto: string): string[] {
  const pliki = plikiAutora(katalog, konto);
  for (const plik of pliki) rmSync(plik);
  return pliki;
}
