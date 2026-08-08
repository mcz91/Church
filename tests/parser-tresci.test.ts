import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  parsujMszeJoomla,
  parsujMszeWordPress,
  znajdzPodstroneMszy,
} from '../narzedzia/parser-tresci.ts';

// Parsery treści dwóch najliczniejszych silników spoza ISP (WordPress,
// Joomla) — deterministyczne, na zarchiwizowanych fixture'ach z URL-em
// i datą pobrania (METADANE.json); zero sieci w suicie.
const fixture = (nazwa: string) =>
  readFileSync(fileURLToPath(new URL(`./fixtures/gdansk/${nazwa}`, import.meta.url)), 'utf-8');

describe('parser podstron WordPressa', () => {
  it('czyta blokowy wariant Gutenberga: etykiety w akapitach, czasy w liniach', () => {
    expect(parsujMszeWordPress(fixture('wp-milosierdzia-msze.html'))).toEqual({
      niedziela:
        '7:00 · 8:15 · 9:30 · 11:00 (z udziałem dzieci) · 12:30 (suma) · 12:15 w domu parafialnym (dla dzieci przedszkolnych, od września do maja) · 16:30 (poza lipcem i sierpniem) · 18:00 (z udziałem młodzieży) · 20:00',
      tydzien: '7:00 · 18:00',
    });
  });

  it('czyta wariant z nagłówkami i listami, z sufiksem językowym w etykiecie', () => {
    expect(parsujMszeWordPress(fixture('wp-mikolaj-msze.html'))).toEqual({
      niedziela:
        '8:00 · 10:00 (rodzinna) · 11:30 (konwentualna) · 16:00 (recytowana) · 19:00 (młodzieżowa i akademicka) · 21:00 (ostatnia w mieście)',
      tydzien: '8:00 · 12:00 (konwentualna) · 19:00',
    });
  });

  it('czyta wariant z kwalifikatorami po godzinach i etykietą „Od poniedziałku do piątku"', () => {
    expect(parsujMszeWordPress(fixture('wp-pio-msze.html'))).toEqual({
      niedziela:
        '07:30 z udziałem dorosłych · 08:45 z udziałem dorosłych · 10:00 z udziałem małych dzieci · 11:15 z udziałem dzieci szkolnych · 12:30 z udziałem dorosłych · 18:00 z udziałem dorosłych',
      tydzien: '7:30 (w adwencie 6:30) · 8:30 · 18:00 · 19:00',
    });
  });
});

describe('parser podstron Joomli', () => {
  it('czyta wariant liniowy z myślnikami i etykietą inline dni powszednich', () => {
    expect(parsujMszeJoomla(fixture('joomla-letnica-msze.html'))).toEqual({
      niedziela: '9:00 - dla dorosłych · 11:00 - suma · 18:00 - dla młodzieży',
      tydzien: '18:00',
    });
  });

  it('etykiety wyłącznie kwalifikowane (rok szkolny/wakacje) odrzuca — rekord poniżej progu', () => {
    expect(parsujMszeJoomla(fixture('joomla-stanislaw-msze.html'))).toBeNull();
  });
});

describe('odnajdywanie podstrony mszy', () => {
  it('wybiera link z „msze" w adresie, omijając porządki wakacyjne i intencje', () => {
    const html = `<nav>
<a href="/intencje-mszalne/">Intencje</a>
<a href="/msze-sw-niedzielne-w-okresie-letnim-vii-viii/">Msze letnie</a>
<a href="/msze-sw-i-nabozenstwa/">Msze św. i nabożeństwa</a>
</nav>`;
    expect(znajdzPodstroneMszy(html)).toBe('/msze-sw-i-nabozenstwa/');
  });

  it('zwraca null, gdy menu nie wskazuje podstrony mszy', () => {
    expect(znajdzPodstroneMszy('<nav><a href="/kontakt">Kontakt</a></nav>')).toBeNull();
  });
});
