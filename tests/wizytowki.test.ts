import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { kandydaciCommons, przetworzWizytowki } from '../narzedzia/wizytowki.ts';
import { parafiaSchema } from '../src/lib/parafie';
import type { Parafia } from '../src/lib/parafie';

// Wizytówki kościołów (docs/11): kandydaci wyłącznie z API Commons
// z metadanymi autor/licencja z extmetadata; zapis wyłącznie po jawnym
// potwierdzeniu człowieka. Testy na zarchiwizowanej odpowiedzi API —
// zero sieci w suicie.
const odpowiedz = JSON.parse(
  readFileSync(
    fileURLToPath(new URL('./fixtures/commons-szukaj-katedra-torun.json', import.meta.url)),
    'utf-8',
  ),
) as Record<string, unknown>;

describe('kandydaci z odpowiedzi API Commons', () => {
  it('wyciąga tytuł, podgląd, stronę pliku oraz autora i licencję z extmetadata', () => {
    const { kandydaci } = kandydaciCommons(odpowiedz);
    expect(kandydaci.length).toBeGreaterThan(0);
    const pierwszy = kandydaci[0];
    expect(pierwszy.tytul).toMatch(/^File:/);
    expect(pierwszy.miniatura).toContain('upload.wikimedia.org');
    expect(pierwszy.opisUrl).toContain('commons.wikimedia.org');
    expect(pierwszy.autor.length).toBeGreaterThan(0);
    expect(pierwszy.licencja).toBe('CC BY-SA 4.0');
    expect(pierwszy.autor).not.toContain('<');
  });

  it('kandydat bez pól autor/licencja w extmetadata odpada z przyczyną', () => {
    const okrojona = structuredClone(odpowiedz) as {
      query: { pages: Record<string, { imageinfo?: { extmetadata?: Record<string, unknown> }[] }> };
    };
    const strona = Object.values(okrojona.query.pages)[0];
    delete strona.imageinfo![0].extmetadata!.Artist;
    const { kandydaci, odrzuceni } = kandydaciCommons(okrojona as Record<string, unknown>);
    expect(kandydaci.length + odrzuceni.length).toBeGreaterThan(0);
    expect(odrzuceni.some((o) => /autor/i.test(o.przyczyna))).toBe(true);
  });

  it('licencja spoza zamkniętej listy wolnych odpada z przyczyną', () => {
    const zmieniona = structuredClone(odpowiedz) as {
      query: {
        pages: Record<
          string,
          { imageinfo?: { extmetadata?: { LicenseShortName?: { value: string } } }[] }
        >;
      };
    };
    for (const strona of Object.values(zmieniona.query.pages)) {
      strona.imageinfo![0].extmetadata!.LicenseShortName = { value: 'CC BY-NC 4.0' };
    }
    const { kandydaci, odrzuceni } = kandydaciCommons(zmieniona as Record<string, unknown>);
    expect(kandydaci).toHaveLength(0);
    expect(odrzuceni.every((o) => /licencj/i.test(o.przyczyna))).toBe(true);
  });
});

describe('schemat zdjęcia-wizytówki parafii', () => {
  const parafia = parafiaSchema.parse({
    nazwa: 'Parafia Testowa Alfa',
    wyznanie: 'testowe',
    miasto: 'Miasto Przykładowe',
    miastoSlug: 'miasto-przykladowe',
    slug: 'parafia-testowa-alfa',
    adres: {
      wartosc: 'ul. Testowa 1',
      zrodlo: { nazwa: 'strona testowa', url: 'https://przyklad.example/zrodlo' },
      dataOdczytu: '2026-08-09',
    },
    osie: {},
  });
  const zdjecie = {
    plik: 'parafia-testowa-alfa.jpg',
    alt: 'bryła testowego kościoła od frontu',
    autor: 'Autor Testowy',
    licencja: 'CC BY-SA 4.0',
    zrodloUrl: 'https://commons.wikimedia.org/wiki/File:Testowy.jpg',
    dataPobrania: '2026-08-09',
  };

  it('przyjmuje zdjęcie z kompletem: plik, alt, autor, wolna licencja, źródło, data', () => {
    expect(parafiaSchema.safeParse({ ...parafia, zdjecie }).success).toBe(true);
    expect(
      parafiaSchema.safeParse({ ...parafia, zdjecie: { ...zdjecie, licencja: 'Public domain' } })
        .success,
    ).toBe(true);
    expect(
      parafiaSchema.safeParse({ ...parafia, zdjecie: { ...zdjecie, licencja: 'CC0' } }).success,
    ).toBe(true);
  });

  it('odrzuca licencje NC i ND oraz spoza listy', () => {
    for (const licencja of ['CC BY-NC 4.0', 'CC BY-ND 2.0', 'CC BY-NC-SA 3.0', 'wszelkie prawa zastrzeżone']) {
      expect(
        parafiaSchema.safeParse({ ...parafia, zdjecie: { ...zdjecie, licencja } }).success,
        licencja,
      ).toBe(false);
    }
  });

  it('odrzuca zdjęcie bez autora albo bez altu', () => {
    const bezAutora: Record<string, unknown> = { ...zdjecie };
    delete bezAutora.autor;
    expect(parafiaSchema.safeParse({ ...parafia, zdjecie: bezAutora }).success).toBe(false);
    expect(
      parafiaSchema.safeParse({ ...parafia, zdjecie: { ...zdjecie, alt: '' } }).success,
    ).toBe(false);
  });
});

describe('kolejka doboru wizytówek', () => {
  const parafia = { slug: 'parafia-testowa-alfa', nazwa: 'Parafia Testowa Alfa', miasto: 'Miasto Przykładowe' };

  function srodowisko(potwierdzenia: Parameters<typeof przetworzWizytowki>[0]['potwierdzenia']) {
    const zapisyObrazow: string[] = [];
    const zapisyRekordow: { slug: string; zdjecie: NonNullable<Parafia['zdjecie']> }[] = [];
    const wynik = przetworzWizytowki({
      parafie: [parafia],
      potwierdzenia,
      szukaj: () => odpowiedz,
      pobierzInfo: (tytul) => {
        const strony = (odpowiedz as { query: { pages: Record<string, unknown> } }).query.pages;
        return (
          (Object.values(strony) as { title: string }[]).find((s) => s.title === tytul) ?? null
        );
      },
      pobierzObraz: () => Buffer.from('obraz-testowy'),
      zapiszObraz: (plik) => zapisyObrazow.push(plik),
      zapiszRekord: (slug, zdjecie) => zapisyRekordow.push({ slug, zdjecie }),
      dataPobrania: '2026-08-09',
    });
    return { wynik, zapisyObrazow, zapisyRekordow };
  }

  it('tryb nieinteraktywny pokazuje kandydatów i niczego nie zapisuje', () => {
    const { wynik, zapisyObrazow, zapisyRekordow } = srodowisko(null);
    expect(zapisyObrazow).toEqual([]);
    expect(zapisyRekordow).toEqual([]);
    expect(wynik.podglad).toHaveLength(1);
    expect(wynik.podglad[0].kandydaci.length).toBeGreaterThan(0);
  });

  it('po potwierdzeniu zapisuje obraz i rekord z metadanymi z API, nie z ręki', () => {
    const { wynik, zapisyObrazow, zapisyRekordow } = srodowisko([
      { slug: 'parafia-testowa-alfa', tytulPliku: 'File:Cathedral of Torun (1).jpg', alt: 'testowa bryła kościoła' },
    ]);
    expect(wynik.zapisane).toEqual(['parafia-testowa-alfa']);
    expect(zapisyObrazow).toEqual(['parafia-testowa-alfa.jpg']);
    expect(zapisyRekordow[0].zdjecie.autor).toBe('Krzysztof Golik');
    expect(zapisyRekordow[0].zdjecie.licencja).toBe('CC BY-SA 4.0');
    expect(zapisyRekordow[0].zdjecie.plik).toBe('parafia-testowa-alfa.jpg');
    expect(zapisyRekordow[0].zdjecie.zrodloUrl).toContain('commons.wikimedia.org');
  });

  it('pobiera render z koszyka 1280 px, choć API wskazuje miniaturę 1920 px', () => {
    const zadaneUrl: string[] = [];
    przetworzWizytowki({
      parafie: [parafia],
      potwierdzenia: [
        { slug: 'parafia-testowa-alfa', tytulPliku: 'File:Cathedral of Torun (1).jpg', alt: 'testowa bryła kościoła' },
      ],
      szukaj: () => odpowiedz,
      pobierzInfo: (tytul) => {
        const strony = (odpowiedz as { query: { pages: Record<string, unknown> } }).query.pages;
        return (
          (Object.values(strony) as { title: string }[]).find((s) => s.title === tytul) ?? null
        );
      },
      pobierzObraz: (url) => {
        zadaneUrl.push(url);
        return Buffer.from('obraz-testowy');
      },
      zapiszObraz: () => {},
      zapiszRekord: () => {},
      dataPobrania: '2026-08-09',
    });
    expect(zadaneUrl).toHaveLength(1);
    expect(zadaneUrl[0]).toContain('/1280px-');
    expect(zadaneUrl[0]).not.toContain('/1920px-');
  });

  it('potwierdzenie pliku spoza wyników albo bez metadanych odpada z przyczyną', () => {
    const { wynik, zapisyRekordow } = srodowisko([
      { slug: 'parafia-testowa-alfa', tytulPliku: 'File:Nieistniejacy.jpg', alt: 'x' },
    ]);
    expect(zapisyRekordow).toEqual([]);
    expect(wynik.odrzucone).toHaveLength(1);
  });
});
