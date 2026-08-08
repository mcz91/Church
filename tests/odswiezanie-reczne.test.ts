import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { doPrzegladu, odciskZrodla, planPozycji } from '../narzedzia/odswiezanie.ts';

// Rekordy ręczne (docs/09, acc. 5): nigdy nie nadpisywane automatycznie;
// zmiana treści źródła od daty odczytu oznacza je „do przeglądu ręcznego".
const fixture = (nazwa: string) =>
  readFileSync(fileURLToPath(new URL(`./fixtures/gdansk/${nazwa}`, import.meta.url)), 'utf-8');

const strona = fixture('strona-isp-chrystuskrol.html');

describe('odcisk godzinowy źródła', () => {
  it('jest deterministyczny dla tej samej treści', () => {
    expect(odciskZrodla(strona)).toBe(odciskZrodla(strona));
  });

  it('zmiana godziny w treści zmienia odcisk', () => {
    expect(odciskZrodla(strona.replace('7.30', '8.30'))).not.toBe(odciskZrodla(strona));
  });

  it('zmiana poza liniami godzinowymi nie zmienia odcisku', () => {
    expect(odciskZrodla(strona.replace('Galerie', 'Fotografie'))).toBe(odciskZrodla(strona));
  });
});

describe('plan odświeżenia pozycji', () => {
  const wpis = { slug: 'wspolnota-testowa-alfa', url: 'https://przyklad.example/strona', dataOdczytu: '2026-08-08', odcisk: odciskZrodla(strona) };

  it('rekord ręczny z niezmienionym źródłem zostaje w spokoju', () => {
    expect(planPozycji('wspolnota-testowa-alfa', [wpis])).toBe('reczny');
    expect(doPrzegladu(wpis, strona)).toBe(false);
  });

  it('rekord ręczny ze zmienionym źródłem idzie do przeglądu ręcznego, nigdy do nadpisania', () => {
    expect(doPrzegladu(wpis, strona.replace('7.30', '8.30'))).toBe(true);
    expect(planPozycji('wspolnota-testowa-alfa', [wpis])).not.toBe('auto');
  });

  it('rekord spoza rejestru ręcznych podlega odświeżeniu automatycznemu', () => {
    expect(planPozycji('inna-wspolnota', [wpis])).toBe('auto');
  });
});
