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
    {
      ...parafia('Parafia Testowa Alfa', 'parafia-testowa-alfa', 'testowe pierwsze'),
      zdjecie: {
        plik: 'parafia-testowa-alfa.png',
        alt: 'bryła testowego kościoła od frontu (obraz syntetyczny)',
        autor: 'Autor Testowy',
        licencja: 'CC BY-SA 4.0',
        zrodloUrl: 'https://commons.wikimedia.org/wiki/File:Testowy.png',
        dataPobrania: '2026-08-09',
      },
    },
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
    },
  });
  czytajHtml(dist);
}, 180_000);

afterAll(() => {
  rmSync(join(korzen, 'tests/fixtures/glosy-build'), { recursive: true, force: true });
  rmSync(join(korzen, 'public/wizytowki/parafia-testowa-alfa.png'), { force: true });
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
    // Ranking przeniósł się ze startu na stronę miasta (CHURCH-7 akc. 2);
    // próg i komunikat o zbyt małej liczbie głosów bez zmian.
    const start = html.get('/miasto-przykladowe/index.html') ?? '';
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
    // Brama prowadzi teraz do osobnych stron miast zamiast do kotwic
    // na jednej długiej stronie; wybór nadal jest zwykłym linkiem.
    const start = html.get('/index.html') ?? '';
    expect(start).toContain('href="/miasto-przykladowe"');
    expect(start).toContain('href="/miasto-probne"');
    expect(html.get('/miasto-probne/index.html') ?? '').toContain('Parafia Testowa Delta');
  });

  it('porównania istnieją wyłącznie w obrębie jednego miasta', () => {
    expect(html.has('/porownaj/parafia-testowa-alfa-vs-parafia-testowa-beta/index.html')).toBe(true);
    expect(html.has('/porownaj/parafia-testowa-alfa-vs-parafia-testowa-delta/index.html')).toBe(false);
  });

  it('profil nie proponuje porównania z parafią innego miasta', () => {
    expect(profil('parafia-testowa-delta')).not.toContain('-vs-parafia-testowa-alfa');
  });

  it('ranking renderuje się per miasto — miasto bez progu nie ma zestawienia', () => {
    expect((html.get('/miasto-przykladowe/index.html') ?? '').split('<ol class="rank-lista">')).toHaveLength(2);
    expect(html.get('/miasto-probne/index.html') ?? '').not.toContain('<ol class="rank-lista">');
  });
});

describe('strony miast i brama startowa', () => {
  it('każde miasto ma własną stronę z listą parafii i rankingiem', () => {
    expect(html.has('/miasto-przykladowe/index.html')).toBe(true);
    expect(html.has('/miasto-probne/index.html')).toBe(true);
    const przykladowe = html.get('/miasto-przykladowe/index.html') ?? '';
    expect(przykladowe).toContain('Parafia Testowa Alfa');
    expect(przykladowe).toContain('Parafia Testowa Beta');
    expect(przykladowe).not.toContain('Parafia Testowa Delta');
    expect(przykladowe).toContain('<ol class="rank-lista">');
  });

  it('start jest bramą: karty miast z liczbą parafii, bez pełnej listy i rankingu', () => {
    const start = html.get('/index.html') ?? '';
    expect(start).toContain('href="/miasto-przykladowe"');
    expect(start).toContain('href="/miasto-probne"');
    expect(start).toContain('3 parafie');
    expect(start).toContain('1 parafia');
    expect(start).not.toContain('<ol class="rank-lista">');
  });

  it('stare kotwice miast nadal prowadzą do celu na stronie startowej', () => {
    const start = html.get('/index.html') ?? '';
    expect(start).toContain('id="miasto-miasto-przykladowe"');
    expect(start).toContain('id="miasto-miasto-probne"');
  });
});

describe('statyczne strony-filtry faktów', () => {
  it('oś z danymi dostaje stronę filtru z wartościami i źródłami', () => {
    expect(html.has('/miasto-przykladowe/msze-w-niedziele/index.html')).toBe(true);
    const strona = html.get('/miasto-przykladowe/msze-w-niedziele/index.html') ?? '';
    expect(strona).toContain('Parafia Testowa Alfa');
    expect(strona).toContain('9:00 · 11:00');
    expect(strona).toContain('strona testowa');
  });

  it('oś bez ani jednej parafii z faktem nie generuje strony', () => {
    for (const slug of ['spowiedz-poza-msza', 'transmisja-online', 'dostepnosc', 'muzyka']) {
      expect(html.has(`/miasto-przykladowe/${slug}/index.html`)).toBe(false);
    }
  });

  it('strona miasta prowadzi do istniejących filtrów i tylko do nich', () => {
    const miasto = html.get('/miasto-przykladowe/index.html') ?? '';
    expect(miasto).toContain('href="/miasto-przykladowe/msze-w-niedziele"');
    expect(miasto).not.toContain('href="/miasto-przykladowe/transmisja-online"');
  });
});

describe('wybór pary i strona 404', () => {
  it('formularz pary nie jest renderowany jako działający bez JavaScriptu', () => {
    const miasto = html.get('/miasto-przykladowe/index.html') ?? '';
    expect(miasto).toMatch(/<form[^>]*id="para"[^>]*hidden/);
  });

  it('bez SITE_URL build przechodzi i nie emituje adresów absolutnych', () => {
    for (const tresc of html.values()) {
      expect(tresc).not.toContain('og:url');
      expect(tresc).not.toContain('og:image');
    }
    expect(html.has('/sitemap.xml')).toBe(false);
  });

  it('strona 404 istnieje i prowadzi do miast', () => {
    expect(html.has('/404.html')).toBe(true);
    const strona = html.get('/404.html') ?? '';
    expect(strona).toContain('href="/miasto-przykladowe"');
    expect(strona).toContain('href="/miasto-probne"');
  });
});

// Panel zawężania mieszka od CHURCH-7 na stronie miasta — start jest
// bramą, a lista parafii przeniosła się razem z nim.
describe('zawężanie listy na stronie miasta', () => {
  const miasto = () => html.get('/miasto-przykladowe/index.html') ?? '';

  // Zawężanie jest dodatkiem: siedzi w zwiniętym „details", żeby nie
  // zabierało uwagi liście parafii (żądanie operatora 2026-08-10).
  it('panel filtrów jest zwinięty i ukryty do czasu włączenia skryptem', () => {
    expect(miasto()).toMatch(/<details[^>]*id="filtry"[^>]*hidden/);
    expect(miasto()).not.toMatch(/<details[^>]*id="filtry"[^>]*\sopen/);
    expect(miasto()).toContain('Msza z udziałem dzieci');
    expect(miasto()).toContain('Spowiedź poza mszą');
  });

  it('wiersz niesie pewne godziny mszy do filtrowania po stronie przeglądarki', () => {
    expect(miasto()).toContain('data-nd="9:00,11:00"');
  });

  it('pełna lista parafii miasta jest w HTML niezależnie od filtrów', () => {
    for (const nazwa of ['Parafia Testowa Alfa', 'Parafia Testowa Beta', 'Parafia Testowa Gamma']) {
      expect(miasto()).toContain(nazwa);
    }
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

describe('wizytówka kościoła w buildzie', () => {
  it('profil ze zdjęciem-wizytówką renderuje je u góry arkusza z altem i atrybucją z linkiem', () => {
    const strona = profil('parafia-testowa-alfa');
    expect(strona).toContain('class="wizytowka"');
    expect(strona).toContain('alt="bryła testowego kościoła od frontu (obraz syntetyczny)"');
    expect(strona).toContain('fot. Autor Testowy');
    expect(strona).toContain('CC BY-SA 4.0');
    expect(strona).toContain('https://commons.wikimedia.org/wiki/File:Testowy.png');
  });

  it('profil bez wizytówki renderuje arkusz dokładnie jak dotąd', () => {
    expect(profil('parafia-testowa-gamma')).not.toContain('class="wizytowka"');
  });

  it('lista miasta pokazuje miniaturę przy wierszu parafii ze zdjęciem', () => {
    const miasto = html.get('/miasto-przykladowe/index.html') ?? '';
    expect(miasto).toContain('class="mini"');
    expect(miasto).toContain('/wizytowki/parafia-testowa-alfa.png');
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
