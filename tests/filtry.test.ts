import { describe, expect, it } from 'vitest';
import { FILTRY, filtrPoSlugu, parafieFiltru } from '../src/lib/filtry.ts';

// Strony-filtry (CHURCH-7 akc. 3): kwalifikacja wyłącznie z istnienia
// albo treści osi faktów — nigdy z ocen. Adresy pochodzą z zamkniętej
// mapy, nie z etykiet, więc zmiana etykiety nie psuje linków.
// Dane jawnie fikcyjne.

const fakt = (wartosc: string) => ({
  wartosc,
  zrodlo: { nazwa: 'strona testowa', url: 'https://przyklad.example/z' },
  dataOdczytu: '2026-08-08',
});

const parafia = (slug: string, osie: Record<string, ReturnType<typeof fakt>>) => ({
  nazwa: `Parafia ${slug}`,
  wyznanie: 'testowe',
  miasto: 'Miasto Przykładowe',
  miastoSlug: 'miasto-przykladowe',
  slug,
  adres: fakt('ul. Testowa 1'),
  osie,
});

describe('adresy filtrów', () => {
  it('są stabilne i pochodzą z zamkniętej mapy, nie z etykiet', () => {
    expect(FILTRY.spowiedz.slug).toBe('spowiedz-poza-msza');
    expect(FILTRY.mszeSzczegolne.slug).toBe('msza-z-dziecmi');
    expect(FILTRY.transmisja.slug).toBe('transmisja-online');
  });

  it('każdy slug jest unikalny i daje się odwrócić na oś', () => {
    const slugi = Object.values(FILTRY).map((f) => f.slug);
    expect(new Set(slugi).size).toBe(slugi.length);
    expect(filtrPoSlugu('spowiedz-poza-msza')).toBe('spowiedz');
    expect(filtrPoSlugu('nie-ma-takiego')).toBeNull();
  });
});

describe('dobór parafii do filtra', () => {
  it('bierze parafie, które mają daną oś faktu', () => {
    const parafie = [
      parafia('z-spowiedzia', { spowiedz: fakt('w piątki 17:00–18:00') }),
      parafia('bez-spowiedzi', { mszeNiedziela: fakt('8:00') }),
    ];
    expect(parafieFiltru(parafie, 'spowiedz').map((p) => p.slug)).toEqual(['z-spowiedzia']);
  });

  it('gdy filtr obiecuje konkret, sprawdza treść osi, nie samo jej istnienie', () => {
    const parafie = [
      parafia('z-dziecmi', { mszeSzczegolne: fakt('msza z udziałem dzieci o 11:30') }),
      parafia('po-angielsku', { mszeSzczegolne: fakt('msza po angielsku o 18:00') }),
    ];
    expect(parafieFiltru(parafie, 'mszeSzczegolne').map((p) => p.slug)).toEqual(['z-dziecmi']);
  });

  it('oś bez danych nie daje żadnej parafii — strona filtru nie powstanie', () => {
    const parafie = [parafia('jakas', { mszeNiedziela: fakt('8:00') })];
    expect(parafieFiltru(parafie, 'dostepnosc')).toEqual([]);
    expect(parafieFiltru(parafie, 'transmisja')).toEqual([]);
  });

  it('transmisja liczy się wyłącznie przy potwierdzeniu, nie przy zaprzeczeniu', () => {
    const parafie = [
      parafia('nadaje', { transmisja: fakt('tak, na kanale parafii') }),
      parafia('nie-nadaje', { transmisja: fakt('nie') }),
    ];
    expect(parafieFiltru(parafie, 'transmisja').map((p) => p.slug)).toEqual(['nadaje']);
  });

  it('zachowuje kolejność wejściową, więc strona jest deterministyczna', () => {
    const parafie = [
      parafia('b', { spowiedz: fakt('x') }),
      parafia('a', { spowiedz: fakt('y') }),
    ];
    expect(parafieFiltru(parafie, 'spowiedz').map((p) => p.slug)).toEqual(['b', 'a']);
  });
});
