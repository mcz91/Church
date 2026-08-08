import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { listaBazowaSchema } from '../src/lib/lista-bazowa';

// Pozycja jawnie fikcyjna do testów schematu.
const pozycja = {
  id: 'test-1',
  nazwa: 'Wspólnota Testowa Alfa',
  wyznanie: 'testowe',
  miejscowosc: 'Miasto Przykładowe',
  slug: 'wspolnota-testowa-alfa',
  zrodlo: { nazwa: 'katalog testowy', url: 'https://przyklad.example/katalog' },
  dataOdczytu: '2026-08-08',
};

const lista = {
  miasto: 'Miasto Przykładowe',
  miastoSlug: 'miasto-przykladowe',
  pozaMianownikiem: 'Wspólnoty bez publicznego katalogu wyznania pozostają poza listą.',
  pozycje: [pozycja],
};

describe('schemat listy bazowej miasta', () => {
  it('przyjmuje listę, której każda pozycja ma źródło z katalogu i datę odczytu', () => {
    expect(listaBazowaSchema.safeParse(lista).success).toBe(true);
  });

  it('odrzuca pozycję bez źródła', () => {
    const bezZrodla: Record<string, unknown> = { ...pozycja };
    delete bezZrodla.zrodlo;
    expect(listaBazowaSchema.safeParse({ ...lista, pozycje: [bezZrodla] }).success).toBe(false);
  });

  it('odrzuca pozycję bez daty odczytu', () => {
    const bezDaty: Record<string, unknown> = { ...pozycja };
    delete bezDaty.dataOdczytu;
    expect(listaBazowaSchema.safeParse({ ...lista, pozycje: [bezDaty] }).success).toBe(false);
  });

  it('odrzuca listę bez dokumentacji wspólnot poza mianownikiem', () => {
    expect(listaBazowaSchema.safeParse({ ...lista, pozaMianownikiem: '' }).success).toBe(false);
  });
});

describe('lista bazowa Gdańska w repozytorium', () => {
  const sciezka = fileURLToPath(new URL('../src/dane/lista-bazowa/gdansk.json', import.meta.url));

  it('istnieje i przechodzi schemat', () => {
    expect(existsSync(sciezka)).toBe(true);
    const dane = listaBazowaSchema.parse(JSON.parse(readFileSync(sciezka, 'utf-8')));
    expect(dane.miastoSlug).toBe('gdansk');
    expect(dane.pozycje.length).toBeGreaterThanOrEqual(50);
    expect(dane.pozaMianownikiem.length).toBeGreaterThan(0);
  });

  it('ma unikatowe slugi i identyfikatory pozycji', () => {
    const dane = listaBazowaSchema.parse(JSON.parse(readFileSync(sciezka, 'utf-8')));
    expect(new Set(dane.pozycje.map((p) => p.slug)).size).toBe(dane.pozycje.length);
    expect(new Set(dane.pozycje.map((p) => p.id)).size).toBe(dane.pozycje.length);
  });
});
