import { describe, expect, it } from 'vitest';
import { godzinyPewne, naMinuty, wkrotce } from '../src/lib/msze.ts';

// Godziny mszy w rekordach są wolnym tekstem ze źródła (dopiski
// sezonowe, inne dni, negacje). Wyszukiwarka „msza niedługo" może
// pokazać wyłącznie godziny pewne — pozycja dwuznaczna ma odpaść,
// nigdy zostać zgadnięta: błędna godzina mszy to realna szkoda.
// Łańcuchy poniżej to rzeczywiste wartości z rekordów w repo.

describe('wydobycie pewnych godzin z zapisu porządku mszy', () => {
  it('bierze wszystkie godziny prostej listy i normalizuje zapis dwucyfrowy', () => {
    expect(godzinyPewne('8:00 · 10:00 · 12:00 · 18:00').pewne).toEqual([
      '8:00',
      '10:00',
      '12:00',
      '18:00',
    ]);
    expect(godzinyPewne('07:30 z udziałem dorosłych · 08:45 z udziałem dorosłych').pewne).toEqual([
      '7:30',
      '8:45',
    ]);
  });

  it('dopisek opisowy nie unieważnia godziny', () => {
    const { pewne } = godzinyPewne(
      '7:30 · 9:00 (kapitulna) · 10:30 (suma parafialna) · 12:00 (dla dzieci) · 18:00',
    );
    expect(pewne).toEqual(['7:30', '9:00', '10:30', '12:00', '18:00']);
  });

  it('dopisek sezonowy albo warunkowy odrzuca godzinę', () => {
    const { pewne, odrzucone } = godzinyPewne(
      '7:00 · 12:00 · 13:30 (poza lipcem i sierpniem) · 19:15 (tylko w lipcu i sierpniu)',
    );
    expect(pewne).toContain('7:00');
    expect(pewne).not.toContain('13:30');
    expect(pewne).not.toContain('19:15');
    expect(odrzucone).toContain('13:30');
    expect(odrzucone).toContain('19:15');
  });

  it('zdanie negujące unieważnia tę samą godzinę w całym wpisie', () => {
    const { pewne } = godzinyPewne(
      '8:00 · 10:30 · 12:00 · 18:00 · W czasie wakacji nie ma Mszy o godzinie 12:00',
    );
    expect(pewne).toContain('8:00');
    expect(pewne).toContain('10:30');
    expect(pewne).not.toContain('12:00');
  });

  it('godzina przypisana innemu dniu nie wchodzi do porządku niedzielnego', () => {
    const { pewne } = godzinyPewne('sobota 18:00 (msza niedzielna) · 7:30 · 9:00');
    expect(pewne).toEqual(['7:30', '9:00']);
  });

  it('wpis w całości warunkowy nie daje żadnej pewnej godziny', () => {
    const { pewne } = godzinyPewne(
      '7:00 (lub w Adwencie 6:30 Roraty) · 8:00 (z wyjątkiem lipca i sierpnia) · 18:00 (lub 15:00 w czasie kolęd)',
    );
    expect(pewne).toEqual([]);
  });
});

describe('najbliższe msze w oknie czasowym', () => {
  it('liczy minuty od północy', () => {
    expect(naMinuty('7:30')).toBe(450);
    expect(naMinuty('18:00')).toBe(1080);
  });

  it('zwraca msze zaczynające się w oknie, rosnąco, z czasem oczekiwania', () => {
    expect(wkrotce(['7:30', '19:00', '18:30', '20:00'], naMinuty('18:10'), 60)).toEqual([
      { godzina: '18:30', za: 20 },
      { godzina: '19:00', za: 50 },
    ]);
  });

  it('msza poza oknem nie wchodzi', () => {
    expect(wkrotce(['20:00'], naMinuty('18:10'), 60)).toEqual([]);
  });

  it('msza, która już się zaczęła, nie jest najbliższa', () => {
    expect(wkrotce(['18:00'], naMinuty('18:01'), 60)).toEqual([]);
  });
});
