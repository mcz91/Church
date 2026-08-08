import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

// Build na danych jawnie fikcyjnych (parafie i głosy testowe, niemylące
// się z realnymi wspólnotami i osobami) dowodzi zachowań obserwowalnych
// w wygenerowanym HTML: publikacji wyłącznie approved, agregatów od
// pierwszego głosu, progu rankingu i nieobecności e-maili.

const korzen = fileURLToPath(new URL('..', import.meta.url));
const EMAIL = /[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)+/i;

const parafia = (nazwa: string, slug: string, wyznanie: string) => ({
  nazwa,
  wyznanie,
  miasto: 'Miasto Przykładowe',
  miastoSlug: 'miasto-przykladowe',
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
) => ({
  parafiaSlug: slug,
  autor: { pseudonim, konto },
  status,
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

beforeAll(() => {
  const parafieDir = mkdtempSync(join(tmpdir(), 'parafie-fixture-'));
  const glosyDir = mkdtempSync(join(tmpdir(), 'glosy-fixture-'));
  dist = mkdtempSync(join(tmpdir(), 'build-glosy-'));

  const parafie = [
    parafia('Parafia Testowa Alfa', 'parafia-testowa-alfa', 'testowe pierwsze'),
    parafia('Parafia Testowa Beta', 'parafia-testowa-beta', 'testowe drugie'),
    parafia('Parafia Testowa Gamma', 'parafia-testowa-gamma', 'testowe pierwsze'),
  ];
  for (const p of parafie) writeFileSync(join(parafieDir, `${p.slug}.json`), JSON.stringify(p));

  // alfa: 5 głosów approved (średnia 4,6) + pending + rejected;
  // beta: 2 approved (pod progiem rankingu); gamma: żadnego głosu.
  const glosy = [
    glos('parafia-testowa-alfa', 'k1', 'Aniela Testowa', 5, 'approved', 'Testowy głos pierwszy.'),
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

const profil = (slug: string) => html.get(`/parafia/miasto-przykladowe/${slug}/index.html`) ?? '';

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

describe('formularz głosu w buildzie', () => {
  it('strona głosu istnieje, prowadzi zwykłym POST-em i pokazuje zasady moderacji', () => {
    const strona = html.get('/glos/parafia-testowa-alfa/index.html') ?? '';
    expect(strona).toContain('method="post"');
    expect(strona).toContain('moderacj');
    expect(strona).toContain('doświadczeni');
    expect(strona).not.toMatch(EMAIL);
  });
});
