import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { kandydaci, przetworzKolejke, zawieraGodzine } from '../narzedzia/kolejka.ts';

// Kolejka wyjątków ręcznych (docs/09, acc. 4): kandydaci wybierani
// deterministycznie są pomocą; zapis wyłącznie po jawnym potwierdzeniu
// człowieka, zweryfikowanym przeciw treści strony źródłowej.
const fixture = (nazwa: string) =>
  readFileSync(fileURLToPath(new URL(`./fixtures/gdansk/${nazwa}`, import.meta.url)), 'utf-8');

const stronaISP = fixture('strona-isp-chrystuskrol.html');

// Dane jawnie fikcyjne — pozycje i karta testowa.
const pozycja = { id: 'test-1', nazwa: 'Wspólnota Testowa Alfa', slug: 'wspolnota-testowa-alfa', www: 'https://przyklad.example/strona' };
const karta = {
  wyznanie: 'testowe',
  patron: 'Wspólnoty Testowej Alfa',
  ulica: 'ul. Testowa 1',
  kodMiejscowosc: '00-001 Miasto Przykładowe',
};

function srodowisko(potwierdzenia: Parameters<typeof przetworzKolejke>[0]['potwierdzenia']) {
  const zapisy: { slug: string }[] = [];
  const wynik = przetworzKolejke({
    pozycje: [pozycja],
    potwierdzenia,
    pobierz: () => stronaISP,
    pobierzKarte: () => karta,
    zapisz: (slug) => zapisy.push({ slug }),
    dataOdczytu: '2026-08-08',
    miasto: { nazwa: 'Miasto Przykładowe', slug: 'miasto-przykladowe' },
  });
  return { wynik, zapisy };
}

describe('kandydaci-fragmenty', () => {
  it('wybiera deterministycznie linie z wzorcami godzin i etykiet', () => {
    const linie = kandydaci(stronaISP);
    expect(linie.length).toBeGreaterThan(0);
    expect(linie.some((l) => l.includes('7.30') || l.includes('7:30'))).toBe(true);
    expect(kandydaci(stronaISP)).toEqual(kandydaci(stronaISP));
  });
});

describe('weryfikacja wartości przeciw treści źródła', () => {
  it('potwierdza wartość, której każda godzina występuje na stronie', () => {
    expect(zawieraGodzine(stronaISP, '7:30 · 9:30 · 18:00')).toBe(true);
  });

  it('odrzuca wartość z godziną nieobecną na stronie', () => {
    expect(zawieraGodzine(stronaISP, '7:30 · 23:59')).toBe(false);
  });
});

describe('tryby kolejki', () => {
  it('bez potwierdzeń nie tworzy żadnego pliku — wyłącznie podgląd kandydatów', () => {
    const { wynik, zapisy } = srodowisko(null);
    expect(zapisy).toEqual([]);
    expect(wynik.zapisane).toEqual([]);
    expect(wynik.podglad).toHaveLength(1);
    expect(wynik.podglad[0].kandydaci.length).toBeGreaterThan(0);
  });

  it('zapisuje rekord po potwierdzeniu, z jawnym oznaczeniem odczytu ręcznego w źródle', () => {
    const { wynik, zapisy } = srodowisko([
      { pozycja: 'test-1', url: 'https://przyklad.example/strona', niedziela: '7:30 · 9:30 · 18:00' },
    ]);
    expect(zapisy).toHaveLength(1);
    expect(wynik.zapisane).toEqual(['wspolnota-testowa-alfa']);
    const rekord = wynik.rekordy[0];
    expect(rekord.osie.mszeNiedziela?.zrodlo.nazwa).toContain('odczyt ręczny');
    expect(rekord.osie.mszeNiedziela?.zrodlo.url).toBe('https://przyklad.example/strona');
    expect(rekord.osie.mszeNiedziela?.dataOdczytu).toBe('2026-08-08');
  });

  it('odmawia zapisu wartości bez pokrycia w treści strony', () => {
    const { wynik, zapisy } = srodowisko([
      { pozycja: 'test-1', url: 'https://przyklad.example/strona', niedziela: '23:59' },
    ]);
    expect(zapisy).toEqual([]);
    expect(wynik.odrzucone).toHaveLength(1);
    expect(wynik.odrzucone[0].powod).toMatch(/pokrycia|treści/i);
  });
});
