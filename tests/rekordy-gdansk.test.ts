import { describe, expect, it } from 'vitest';
import { normalizujGodziny, slugify, zbudujRekord } from '../narzedzia/rekordy.ts';
import { parafiaSchema } from '../src/lib/parafie';

// Wejścia odzwierciedlają realne struktury źródeł; wynik przechodzi
// schemat parafii z CHURCH-1 albo ląduje w wyjątkach — nigdy w danych.
const karta = { id: '322', nazwa: 'Chrystusa Króla', dekanat: 'Gdańsk Śródmieście', miejscowosc: 'Gdańsk' };
const szczegoly = {
  wyznanie: 'rzymskokatolicka',
  patron: 'Chrystusa Króla',
  ulica: 'ul. Bł. Ks. Franciszka Rogaczewskiego 55',
  kodMiejscowosc: '80-804 Gdańsk',
  www: 'http://www.chrystuskrol.diecezja.gda.pl',
};
const msze = { niedziela: '7:30 · 9:30 · 18:00', tydzien: '7:00 · 18:00', spowiedz: '10 minut przed Mszą Świętą' };
const zrodloKatalogu = { url: 'https://www.diecezja.gda.pl/parafie/322', dataOdczytu: '2026-08-08' };
const zrodloStrony = { url: 'https://www.chrystuskrol.diecezja.gda.pl/', dataOdczytu: '2026-08-08' };

describe('budowa rekordu parafii Gdańska', () => {
  it('komplet źródeł daje rekord przechodzący schemat parafii', () => {
    const wynik = zbudujRekord({ karta, szczegoly, msze, zrodloKatalogu, zrodloStrony });
    if (!('rekord' in wynik)) throw new Error(`oczekiwano rekordu, jest wyjątek: ${wynik.wyjatek.przyczyna}`);
    expect(parafiaSchema.safeParse(wynik.rekord).success).toBe(true);
    expect(wynik.rekord.nazwa).toBe('Parafia pw. Chrystusa Króla');
    expect(wynik.rekord.slug).toBe('chrystusa-krola');
    expect(wynik.rekord.miasto).toBe('Gdańsk');
    expect(wynik.rekord.miastoSlug).toBe('gdansk');
    expect(wynik.rekord.adres.wartosc).toBe('ul. Bł. Ks. Franciszka Rogaczewskiego 55, 80-804 Gdańsk');
    expect(wynik.rekord.adres.zrodlo.url).toBe(zrodloKatalogu.url);
    expect(wynik.rekord.osie.mszeNiedziela?.wartosc).toBe('7:30 · 9:30 · 18:00');
    expect(wynik.rekord.osie.mszeNiedziela?.zrodlo.url).toBe(zrodloStrony.url);
    expect(wynik.rekord.osie.spowiedz?.wartosc).toBe('10 minut przed Mszą Świętą');
  });

  it('rekord poniżej progu jakości (bez mszy niedzielnych) nie powstaje — idzie do wyjątków', () => {
    const wynik = zbudujRekord({ karta, szczegoly, msze: null, zrodloKatalogu });
    if ('rekord' in wynik) throw new Error('rekord poniżej progu nie może wejść do danych');
    expect(wynik.wyjatek.pozycja).toBe('322');
    expect(wynik.wyjatek.przyczyna).toMatch(/progu|msz/i);
  });

  it('karta bez szczegółów (katalog nieczytelny) idzie do wyjątków', () => {
    const wynik = zbudujRekord({ karta, szczegoly: null, msze, zrodloKatalogu, zrodloStrony });
    expect('wyjatek' in wynik).toBe(true);
  });
});

describe('pomocnicze funkcje deterministyczne', () => {
  it('slugify transliteruje polskie znaki i interpunkcję', () => {
    expect(slugify('Bł. Doroty z Mątew')).toBe('bl-doroty-z-matew');
    expect(slugify('Św. Brata Alberta')).toBe('sw-brata-alberta');
    expect(slugify('Chrystusa Króla')).toBe('chrystusa-krola');
  });

  it('normalizuje godziny z kropką i przecinkami na format kanoniczny', () => {
    expect(normalizujGodziny('7.30, 9.30, 11.00 (dla dzieci), 18.00')).toBe(
      '7:30 · 9:30 · 11:00 (dla dzieci) · 18:00',
    );
    expect(normalizujGodziny('12.30 (Suma, parafialna), 18.00')).toBe('12:30 (Suma, parafialna) · 18:00');
    expect(normalizujGodziny('7.00; 8.30 (suma); 18.00')).toBe('7:00 · 8:30 (suma) · 18:00');
  });

  it('tekst bez ani jednej godziny jest wątpliwy — zwraca null', () => {
    expect(normalizujGodziny('porządek wakacyjny w ogłoszeniach')).toBeNull();
  });
});
