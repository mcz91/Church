import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { syntetycznyPNG } from './pomoc-obrazy.ts';

// Build na danych jawnie fikcyjnych (parafie i głosy testowe, niemylące
// się z realnymi wspólnotami i osobami) dowodzi zachowań obserwowalnych
// w wygenerowanym HTML: publikacji wyłącznie approved, agregatów od
// pierwszego głosu, progu rankingu i nieobecności e-maili.

const korzen = fileURLToPath(new URL('..', import.meta.url));
const EMAIL = /[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)+/i;

const parafia = (
  nazwa: string,
  slug: string,
  wyznanie: string,
  miasto = 'Miasto Przykładowe',
  miastoSlug = 'miasto-przykladowe',
) => ({
  nazwa,
  wyznanie,
  miasto,
  miastoSlug,
  slug,
  adres: {
    wartosc: 'ul. Testowa 1, Miasto Przykładowe',
    zrodlo: { nazwa: 'strona testowa', url: 'https://przyklad.example/zrodlo' },
    dataOdczytu: '2026-08-08',
  },
  osie: {
    mszeNiedziela: {
      wartosc: '9:00 · 11:00',
      zrodlo: { nazwa: 'strona testowa', url: 'https://przyklad.example/zrodlo' },
      dataOdczytu: '2026-08-08',
    },
  },
});

const glos = (
  slug: string,
  konto: string,
  pseudonim: string,
  ocenaOgolna: number,
  status: string,
  tekst?: string,
  zdjecia?: { plik: string; alt: string; podpis?: string }[],
) => ({
  parafiaSlug: slug,
  autor: { pseudonim, konto },
  status,
  ...(zdjecia ? { zdjecia } : {}),
  ocenaOgolna,
  wymiary: { przyjecie: 5, muzyka: 4, zDziecmi: 4, dostepnosc: 4, organizacja: 4 },
  ...(tekst ? { tekst } : {}),
  data: '2026-08-08',
});

let dist: string;
const html = new Map<string, string>();

function czytajHtml(katalog: string) {
  for (const wpis of readdirSync(katalog, { recursive: true, withFileTypes: true })) {
    if (wpis.isFile() && wpis.name.endsWith('.html')) {
      const sciezka = join(wpis.parentPath, wpis.name);
      html.set(sciezka.slice(dist.length), readFileSync(sciezka, 'utf-8'));
    }
  }
}

// Katalog fixture'ów głosów żyje w repozytorium (usuwany po teście),
// bo tylko ścieżki repo są osiągalne dla builda przy osadzaniu obrazów.
const glosyDir = join(korzen, 'tests/fixtures/glosy-build/dane');
let parafieDir: string;

beforeAll(() => {
  parafieDir = mkdtempSync(join(tmpdir(), 'parafie-fixture-'));
  rmSync(join(korzen, 'tests/fixtures/glosy-build'), { recursive: true, force: true });
  mkdirSync(glosyDir, { recursive: true });
  dist = mkdtempSync(join(tmpdir(), 'build-glosy-'));

  const parafie = [
    parafia('Parafia Testowa Alfa', 'parafia-testowa-alfa', 'testowe pierwsze'),
    parafia('Parafia Testowa Beta', 'parafia-testowa-beta', 'testowe drugie'),
    parafia('Parafia Testowa Gamma', 'parafia-testowa-gamma', 'testowe pierwsze'),
    parafia('Parafia Testowa Delta', 'parafia-testowa-delta', 'testowe pierwsze', 'Miasto Próbne', 'miasto-probne'),
  ];
  for (const p of parafie) writeFileSync(join(parafieDir, `${p.slug}.json`), JSON.stringify(p));

  // alfa: 5 głosów approved (średnia 4,6) + pending + rejected;
  // beta: 2 approved (pod progiem rankingu); gamma: żadnego głosu.
  const glosy = [
    glos('parafia-testowa-alfa', 'k1', 'Aniela Testowa', 5, 'approved', 'Testowy głos pierwszy.', [
      { plik: 'k1-1.png', alt: 'wnętrze testowego kościoła (obraz syntetyczny)', podpis: 'nawa testowa' },
    ]),
    glos('parafia-testowa-alfa', 'k2', 'Bogumił Testowy', 4, 'approved'),
    glos('parafia-testowa-alfa', 'k3', 'Celina Testowa', 5, 'approved'),
    glos('parafia-testowa-alfa', 'k4', 'Dobromir Testowy', 4, 'approved'),
    glos('parafia-testowa-alfa', 'k5', 'Emilia Testowa', 5, 'approved'),
    glos('parafia-testowa-alfa', 'k6', 'Oczekujący Oskar', 1, 'pending', 'TEKST-PENDING-NIEPUBLICZNY'),
    glos('parafia-testowa-alfa', 'k7', 'Odrzucona Róża', 1, 'rejected', 'TEKST-REJECTED-NIEPUBLICZNY'),
    glos('parafia-testowa-beta', 'k8', 'Filip Testowy', 4, 'approved'),
    glos('parafia-testowa-beta', 'k9', 'Gaja Testowa', 3, 'approved'),
  ];
  glosy.forEach((g, i) => {
    const katalog = join(glosyDir, g.parafiaSlug);
    mkdirSync(katalog, { recursive: true });
    writeFileSync(join(katalog, `glos-${i}.json`), JSON.stringify(g));
  });
  writeFileSync(join(glosyDir, 'parafia-testowa-alfa/k1-1.png'), syntetycznyPNG(8, 6));

  execFileSync(join(korzen, 'node_modules/.bin/astro'), ['build'], {
    cwd: korzen,
    stdio: 'pipe',
    env: {
      ...process.env,
      PARAFIE_DIR: parafieDir,
      GLOSY_DIR: glosyDir,
      BUILD_OUT_DIR: dist,
    },
  });
  czytajHtml(dist);
}, 180_000);

afterAll(() => {
  rmSync(join(korzen, 'tests/fixtures/glosy-build'), { recursive: true, force: true });
});

const profil = (slug: string) =>
  html.get(`/parafia/miasto-przykladowe/${slug}/index.html`) ??
  html.get(`/parafia/miasto-probne/${slug}/index.html`) ??
  '';

describe('publikacja głosów w buildzie', () => {
  it('renderuje głos approved: cytat, pseudonim, miesiąc', () => {
    const strona = profil('parafia-testowa-alfa');
    expect(strona).toContain('Aniela Testowa');
    expect(strona).toContain('Testowy głos pierwszy.');
    expect(strona).toContain('sierpień 2026');
  });

  it('fixture pending i rejected nie pojawia się w żadnym wygenerowanym HTML', () => {
    expect(html.size).toBeGreaterThan(0);
    for (const tresc of html.values()) {
      expect(tresc).not.toContain('Oczekujący Oskar');
      expect(tresc).not.toContain('Odrzucona Róża');
      expect(tresc).not.toContain('TEKST-PENDING-NIEPUBLICZNY');
      expect(tresc).not.toContain('TEKST-REJECTED-NIEPUBLICZNY');
    }
  });

  it('bez głosów pokazuje zaproszenie zamiast pustki', () => {
    expect(profil('parafia-testowa-gamma')).toContain('eszcze żadnego głosu');
  });
});

describe('agregaty w buildzie', () => {
  it('agregat ogólny i wymiarów renderuje się z liczbą głosów przy ≥ 1 głosie', () => {
    const strona = profil('parafia-testowa-alfa');
    expect(strona).toContain('4,6');
    expect(strona).toContain('5 głosów');
    expect(strona).toContain('Przyjęcie');
    expect(strona).toContain('Organizacja');
  });

  it('bez głosu approved nie ma agregatu ani liczby głosów', () => {
    const strona = profil('parafia-testowa-gamma');
    expect(strona).not.toContain('class="bigscore"');
    expect(strona).not.toContain('Z głosów, w pięciu wymiarach');
    expect(strona).not.toContain('0 głosów');
  });
});

describe('ranking w buildzie', () => {
  it('zestawia wyłącznie parafie nad progiem; poniżej progu — „za mało głosów" bez pozycji', () => {
    const start = html.get('/index.html') ?? '';
    const sekcja = /<ol class="rank-lista">[\s\S]*?<\/ol>/.exec(start)?.[0] ?? '';
    expect(sekcja).toContain('Parafia Testowa Alfa');
    expect(sekcja).not.toContain('Parafia Testowa Beta');
    const zaMalo = /za mało głosów[\s\S]{0,200}/i.exec(start)?.[0] ?? '';
    expect(zaMalo).toContain('Parafia Testowa Beta');
  });
});

describe('bezpieczniki w buildzie', () => {
  it('żaden wygenerowany HTML nie zawiera adresu e-mail', () => {
    for (const [sciezka, tresc] of html) {
      expect(tresc, sciezka).not.toMatch(EMAIL);
    }
  });

  it('żaden wygenerowany HTML nie agreguje głosów ani średnich po wyznaniu', () => {
    const agregatWyznania =
      /(testowe pierwsze|testowe drugie|wyznani\w+)[^<]*(\d,\d|\d+\s*głos|średni\w+)/i;
    const zbiorczo = /(średnia|głosy|głosów)\s+(dla\s+)?wyznani/i;
    for (const [sciezka, tresc] of html) {
      expect(tresc, sciezka).not.toMatch(agregatWyznania);
      expect(tresc, sciezka).not.toMatch(zbiorczo);
    }
  });
});

describe('wielomiastowość w buildzie', () => {
  it('strona startowa daje wybór miasta linkami działającymi bez JavaScriptu', () => {
    const start = html.get('/index.html') ?? '';
    expect(start).toContain('href="#miasto-miasto-przykladowe"');
    expect(start).toContain('href="#miasto-miasto-probne"');
    expect(start).toContain('id="miasto-miasto-probne"');
    expect(start).toContain('Parafia Testowa Delta');
  });

  it('porównania istnieją wyłącznie w obrębie jednego miasta', () => {
    expect(html.has('/porownaj/parafia-testowa-alfa-vs-parafia-testowa-beta/index.html')).toBe(true);
    expect(html.has('/porownaj/parafia-testowa-alfa-vs-parafia-testowa-delta/index.html')).toBe(false);
  });

  it('profil nie proponuje porównania z parafią innego miasta', () => {
    expect(profil('parafia-testowa-delta')).not.toContain('-vs-parafia-testowa-alfa');
  });

  it('ranking renderuje się per miasto — miasto bez progu nie ma zestawienia', () => {
    const start = html.get('/index.html') ?? '';
    expect(start.split('<ol class="rank-lista">')).toHaveLength(2);
  });
});

describe('zgłoszenie błędu faktu w buildzie', () => {
  it('każda karta parafii ma link „zgłoś błąd" do formularza serwisu', () => {
    for (const slug of ['parafia-testowa-alfa', 'parafia-testowa-gamma', 'parafia-testowa-delta']) {
      const strona = profil(slug);
      expect(strona, slug).toMatch(/zgłoś błąd/i);
      expect(strona, slug).toContain(`/blad/`);
    }
  });
});

describe('galeria zdjęć w buildzie', () => {
  it('profil z opublikowanym zdjęciem renderuje galerię: img z altem i podpis „fot. <pseudonim>"', () => {
    const strona = profil('parafia-testowa-alfa');
    expect(strona).toContain('class="gallery"');
    expect(strona).toContain('alt="wnętrze testowego kościoła (obraz syntetyczny)"');
    expect(strona).toContain('nawa testowa');
    expect(strona).toContain('fot. Aniela Testowa');
  });

  it('profil bez zdjęć nie renderuje sekcji galerii', () => {
    expect(profil('parafia-testowa-gamma')).not.toContain('class="gallery"');
  });

  it('wyjście publiczne nie zdradza oryginalnych nazw plików ani metadanych', () => {
    for (const tresc of html.values()) {
      expect(tresc).not.toMatch(/IMG_\d|DSC_\d|Exif/i);
    }
  });

  it('głos approved wskazujący nieistniejący plik zdjęcia nie przechodzi builda', () => {
    const zlyDir = join(korzen, 'tests/fixtures/glosy-build/dane-zly');
    const katalog = join(zlyDir, 'parafia-testowa-alfa');
    mkdirSync(katalog, { recursive: true });
    writeFileSync(
      join(katalog, 'glos-zly.json'),
      JSON.stringify(
        glos('parafia-testowa-alfa', 'k9', 'Helena Testowa', 4, 'approved', undefined, [
          { plik: 'k9-1.png', alt: 'obraz, którego nie ma' },
        ]),
      ),
    );
    const outDir = mkdtempSync(join(tmpdir(), 'build-zly-'));
    expect(() =>
      execFileSync(join(korzen, 'node_modules/.bin/astro'), ['build'], {
        cwd: korzen,
        stdio: 'pipe',
        env: { ...process.env, PARAFIE_DIR: parafieDir, GLOSY_DIR: zlyDir, BUILD_OUT_DIR: outDir },
      }),
    ).toThrow();
  }, 180_000);
});

describe('formularz głosu w buildzie', () => {
  it('strona głosu istnieje, prowadzi zwykłym POST-em i pokazuje zasady moderacji', () => {
    const strona = html.get('/glos/parafia-testowa-alfa/index.html') ?? '';
    expect(strona).toContain('method="post"');
    expect(strona).toContain('moderacj');
    expect(strona).toContain('doświadczeni');
    expect(strona).not.toMatch(EMAIL);
  });
});
