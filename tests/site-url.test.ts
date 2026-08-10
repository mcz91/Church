import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { syntetycznyPNG } from './pomoc-obrazy.ts';

// Udostępnianie (CHURCH-7 akc. 5): dopiero `SITE_URL` pozwala zbudować
// adres absolutny, więc dopiero wtedy powstają `og:url`, `og:image`,
// sitemap i robots. Bez niego build przechodzi i po prostu ich nie ma —
// lepiej bez podglądu niż z adresem zmyślonym.
// Dane jawnie fikcyjne.

const korzen = fileURLToPath(new URL('..', import.meta.url));
const ADRES = 'https://przyklad.example';

const fakt = (wartosc: string) => ({
  wartosc,
  zrodlo: { nazwa: 'strona testowa', url: 'https://przyklad.example/zrodlo' },
  dataOdczytu: '2026-08-08',
});

const parafia = (nazwa: string, slug: string, zdjecie?: string) => ({
  nazwa,
  wyznanie: 'testowe',
  miasto: 'Miasto Przykładowe',
  miastoSlug: 'miasto-przykladowe',
  slug,
  adres: fakt('ul. Testowa 1'),
  osie: { mszeNiedziela: fakt('9:00 · 11:00') },
  ...(zdjecie
    ? {
        zdjecie: {
          plik: zdjecie,
          alt: 'bryła testowego kościoła (obraz syntetyczny)',
          autor: 'Autor Testowy',
          licencja: 'CC0',
          zrodloUrl: 'https://commons.wikimedia.org/wiki/File:Testowy.png',
          dataPobrania: '2026-08-09',
        },
      }
    : {}),
});

let dist: string;
let parafieDir: string;
let glosyDir: string;
const html = new Map<string, string>();

beforeAll(() => {
  parafieDir = mkdtempSync(join(tmpdir(), 'parafie-siteurl-'));
  glosyDir = mkdtempSync(join(tmpdir(), 'glosy-siteurl-'));
  dist = mkdtempSync(join(tmpdir(), 'build-siteurl-'));

  // „alfa" jest pierwsza alfabetycznie w parze i ma wizytówkę; „beta"
  // nie ma żadnej, więc porównanie musi wziąć obraz od alfy.
  for (const p of [
    parafia('Parafia Testowa Alfa', 'parafia-testowa-alfa', 'parafia-testowa-alfa.png'),
    parafia('Parafia Testowa Beta', 'parafia-testowa-beta'),
  ]) {
    writeFileSync(join(parafieDir, `${p.slug}.json`), JSON.stringify(p));
  }
  mkdirSync(join(korzen, 'public/wizytowki'), { recursive: true });
  writeFileSync(join(korzen, 'public/wizytowki/parafia-testowa-alfa.png'), syntetycznyPNG(9, 6));

  execFileSync(join(korzen, 'node_modules/.bin/astro'), ['build'], {
    cwd: korzen,
    stdio: 'pipe',
    env: {
      ...process.env,
      PARAFIE_DIR: parafieDir,
      GLOSY_DIR: glosyDir,
      BUILD_OUT_DIR: dist,
      SITE_URL: ADRES,
    },
  });
  for (const wpis of readdirSync(dist, { recursive: true, withFileTypes: true })) {
    if (wpis.isFile()) {
      const sciezka = join(wpis.parentPath, wpis.name);
      html.set(sciezka.slice(dist.length), readFileSync(sciezka, 'utf-8'));
    }
  }
}, 180_000);

afterAll(() => {
  rmSync(join(korzen, 'public/wizytowki/parafia-testowa-alfa.png'), { force: true });
});

describe('adresy absolutne przy ustawionym SITE_URL', () => {
  it('profil parafii dostaje og:url i wizytówkę jako og:image', () => {
    const profil = html.get('/parafia/miasto-przykladowe/parafia-testowa-alfa/index.html') ?? '';
    expect(profil).toContain(`content="${ADRES}/parafia/miasto-przykladowe/parafia-testowa-alfa"`);
    expect(profil).toContain(`content="${ADRES}/wizytowki/parafia-testowa-alfa.png"`);
  });

  it('porównanie bierze wizytówkę pierwszej alfabetycznie parafii pary', () => {
    const porownanie =
      html.get('/porownaj/parafia-testowa-alfa-vs-parafia-testowa-beta/index.html') ?? '';
    expect(porownanie).toContain(`content="${ADRES}/wizytowki/parafia-testowa-alfa.png"`);
  });

  it('parafia bez wizytówki nie dostaje obrazu — brak zamiast fałszywego', () => {
    const profil = html.get('/parafia/miasto-przykladowe/parafia-testowa-beta/index.html') ?? '';
    expect(profil).toContain('og:url');
    expect(profil).not.toContain('og:image');
  });

  it('sitemap wylicza zbudowane strony, robots wskazuje sitemap', () => {
    const sitemap = html.get('/sitemap.xml') ?? '';
    expect(sitemap).toContain(`${ADRES}/parafia/miasto-przykladowe/parafia-testowa-alfa`);
    expect(sitemap).toContain(`${ADRES}/miasto-przykladowe`);
    expect(html.get('/robots.txt') ?? '').toContain(`Sitemap: ${ADRES}/sitemap.xml`);
  });
});
