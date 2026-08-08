import { describe, expect, it } from 'vitest';
import { glosSchema } from '../src/lib/glosy';

// Dane jawnie fikcyjne — pseudonimy i treści niemylące się z realnymi
// osobami ani wspólnotami.
const glos = {
  parafiaSlug: 'parafia-testowa-alfa',
  autor: { pseudonim: 'Aniela Testowa', konto: 'konto-test-1' },
  status: 'approved',
  ocenaOgolna: 5,
  wymiary: { przyjecie: 5, muzyka: 4, zDziecmi: 5, dostepnosc: 4, organizacja: 5 },
  tekst: 'Testowy głos o testowej parafii.',
  data: '2026-08-08',
};

describe('schemat głosu', () => {
  it('przyjmuje głos z autorem, statusem i ocenami w zakresie', () => {
    expect(glosSchema.safeParse(glos).success).toBe(true);
  });

  it('przyjmuje głos bez tekstu (tekst jest opcjonalny)', () => {
    const bezTekstu: Record<string, unknown> = { ...glos };
    delete bezTekstu.tekst;
    expect(glosSchema.safeParse(bezTekstu).success).toBe(true);
  });

  it('odrzuca głos bez autora', () => {
    const bezAutora: Record<string, unknown> = { ...glos };
    delete bezAutora.autor;
    expect(glosSchema.safeParse(bezAutora).success).toBe(false);
  });

  it('odrzuca autora bez pseudonimu lub bez identyfikatora konta', () => {
    expect(glosSchema.safeParse({ ...glos, autor: { pseudonim: 'Aniela Testowa' } }).success).toBe(false);
    expect(glosSchema.safeParse({ ...glos, autor: { konto: 'konto-test-1' } }).success).toBe(false);
  });

  it('odrzuca głos bez statusu moderacji', () => {
    const bezStatusu: Record<string, unknown> = { ...glos };
    delete bezStatusu.status;
    expect(glosSchema.safeParse(bezStatusu).success).toBe(false);
  });

  it('odrzuca status spoza {pending, approved, rejected}', () => {
    expect(glosSchema.safeParse({ ...glos, status: 'published' }).success).toBe(false);
  });

  it('odrzuca ocenę spoza zakresu 1–5', () => {
    expect(glosSchema.safeParse({ ...glos, ocenaOgolna: 0 }).success).toBe(false);
    expect(glosSchema.safeParse({ ...glos, ocenaOgolna: 6 }).success).toBe(false);
    expect(
      glosSchema.safeParse({ ...glos, wymiary: { ...glos.wymiary, muzyka: 5.5 } }).success,
    ).toBe(false);
  });

  it('odrzuca wymiar spoza zamkniętej piątki dokumentu 03', () => {
    const obcyWymiar = { ...glos, wymiary: { ...glos.wymiary, kaznodziejstwo: 5 } };
    expect(glosSchema.safeParse(obcyWymiar).success).toBe(false);
  });

  it('odrzuca e-mail w jakimkolwiek polu publikowanym', () => {
    expect(
      glosSchema.safeParse({ ...glos, tekst: 'napisz do mnie: osoba@przyklad.example' }).success,
    ).toBe(false);
    expect(
      glosSchema.safeParse({
        ...glos,
        autor: { ...glos.autor, pseudonim: 'osoba@przyklad.example' },
      }).success,
    ).toBe(false);
  });
});
