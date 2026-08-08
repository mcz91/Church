import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  kartyMiasta,
  parsujIndeksKatalogu,
  parsujKarteParafii,
  parsujMszeISP,
} from '../narzedzia/parser-archidiecezji.ts';

// Testy wyłącznie na zarchiwizowanych fixture'ach (URL i data pobrania
// w tests/fixtures/gdansk/METADANE.json) — zero sieci w suicie.
const fixture = (nazwa: string) =>
  readFileSync(fileURLToPath(new URL(`./fixtures/gdansk/${nazwa}`, import.meta.url)), 'utf-8');

const indeks = fixture('katalog-index.html');
const karta322 = fixture('katalog-parafia-322.html');
const karta571 = fixture('katalog-parafia-571.html');
const stronaISP = fixture('strona-isp-chrystuskrol.html');
const stronaISPWariant = fixture('strona-isp-mbbolesna.html');

describe('parser indeksu katalogu archidiecezji', () => {
  it('wyciąga wszystkie karty parafii z indeksu', () => {
    expect(parsujIndeksKatalogu(indeks)).toHaveLength(201);
  });

  it('filtruje karty miasta Gdańska po miejscowości', () => {
    const gdansk = kartyMiasta(parsujIndeksKatalogu(indeks), 'Gdańsk');
    expect(gdansk).toHaveLength(58);
    expect(gdansk.every((k) => k.miejscowosc === 'Gdańsk' || k.miejscowosc.startsWith('Gdańsk '))).toBe(
      true,
    );
  });

  it('karta niesie id, nazwę, dekanat i miejscowość', () => {
    const karta = parsujIndeksKatalogu(indeks).find((k) => k.id === '571');
    expect(karta).toEqual({
      id: '571',
      nazwa: 'Bożego Ciała',
      dekanat: 'Gdańsk Siedlce',
      miejscowosc: 'Gdańsk Morena',
    });
  });

  it('jest deterministyczny: to samo wejście daje ten sam wynik', () => {
    expect(parsujIndeksKatalogu(indeks)).toEqual(parsujIndeksKatalogu(indeks));
  });
});

describe('parser karty parafii', () => {
  it('wyciąga wyznanie, patrona, adres i www', () => {
    expect(parsujKarteParafii(karta322)).toEqual({
      wyznanie: 'rzymskokatolicka',
      patron: 'Chrystusa Króla',
      ulica: 'ul. Bł. Ks. Franciszka Rogaczewskiego 55',
      kodMiejscowosc: '80-804 Gdańsk',
      www: 'http://www.chrystuskrol.diecezja.gda.pl',
    });
  });

  it('czyta kartę bez względu na dzielnicę w miejscowości', () => {
    const karta = parsujKarteParafii(karta571);
    expect(karta?.patron).toBe('Bożego Ciała');
    expect(karta?.ulica).toBe('ul. Piecewska 9');
    expect(karta?.www).toBe('http://www.bozecialo.info');
  });
});

describe('parser porządku mszy ze strony na silniku ISP', () => {
  it('wyciąga i normalizuje msze niedzielne, w tygodniu i spowiedź', () => {
    expect(parsujMszeISP(stronaISP)).toEqual({
      niedziela: '7:30 · 9:30 · 11:00 (dla dzieci) · 12:30 (Suma parafialna) · 18:00 (dla młodzieży)',
      tydzien: '7:00 (lub w Adwencie 6:30 Roraty) · 8:00 (z wyjątkiem lipca i sierpnia) · 18:00 (lub 15:00 w czasie kolęd)',
      spowiedz: '10 minut przed Mszą Świętą',
    });
  });

  it('rozumie wariant etykiet „Niedziele i Święta" ze średnikami, omijając porządek wakacyjny', () => {
    expect(parsujMszeISP(stronaISPWariant)).toEqual({
      niedziela: '7:00 · 8:30 (suma) · 10:00 (młodzież) · 11:30 (dzieci) · 13:00 · 18:00',
      tydzien: '6:30 · 18:00',
    });
  });

  it('rozumie wariant „W NIEDZIELĘ I UROCZYSTOŚCI" z wypunktowaniem i wartością w kolejnym akapicie', () => {
    expect(parsujMszeISP(fixture('strona-isp-ignacy.html'))).toEqual({
      niedziela: '8:00 · 09:30 · 11:00 (z udziałem dzieci) · 12:15 · 18:00',
      tydzien: '6:30 · 18:30',
      spowiedz: '15 minut przed Mszą Świetą w tygodniu, a w niedzielę i święta podczas Mszy Świętej',
    });
  });

  it('rozumie wariant „Niedziela i Uroczystości" z etykietą w osobnym akapicie', () => {
    expect(parsujMszeISP(fixture('strona-isp-benedykta.html'))).toEqual({
      niedziela:
        '7:00 · 8:30 · 10:00 (z udziałem przedszkolaków) · 11:30 (z udziałem dzieci szkolnych) · 13:00 · 19:00',
      tydzien: '7:00 · 18:00',
    });
  });

  it('nie łyka tekstów linków (np. przycisku „Więcej") do wartości faktu', () => {
    // Minimalny syntetyczny wycinek struktury silnika ISP — nie opisuje
    // realnej wspólnoty; realne warianty pokrywają fixture'y wyżej.
    const wycinek = `<div class="gpg-service">
<p><strong>W niedziele i święta:</strong> 8.00, 10.00</p>
<p><strong>SPOWIEDŹ:</strong></p><p>przed każdą Mszą</p>
<p><a class="btn" type="button">Więcej</a></p></div>`;
    expect(parsujMszeISP(wycinek)).toEqual({
      niedziela: '8:00 · 10:00',
      spowiedz: 'przed każdą Mszą',
    });
  });

  it('zwraca null dla strony bez jednoznacznej struktury ISP', () => {
    expect(parsujMszeISP(karta571)).toBeNull();
  });
});
