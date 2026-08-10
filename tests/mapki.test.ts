import { describe, expect, it } from 'vitest';
import { kafelkiWokol, wybierzTrafienie, zapytanieOPolozenie } from '../src/lib/mapki.ts';

// Mapka na karcie parafii: położenie pochodzi z OpenStreetMap
// (Nominatim, ODbL), a nie ze zgadywania. Przyjmujemy wyłącznie
// trafienie będące miejscem kultu — adres pasujący do bloku mieszkalnego
// obok kościoła byłby błędem tej samej klasy, co zła godzina mszy.
// Dane jawnie fikcyjne poza współrzędnymi, które są wynikiem wzoru.

describe('zapytanie o położenie', () => {
  it('zdejmuje „ul." — Nominatim nie znajduje adresu z tym przedrostkiem', () => {
    expect(zapytanieOPolozenie('ul. Kartuska 349, 80-125 Gdańsk Jasień')).toBe(
      'Kartuska 349, 80-125 Gdańsk Jasień',
    );
    expect(zapytanieOPolozenie('al. Jana Pawła II 48, Gdańsk')).toBe('Jana Pawła II 48, Gdańsk');
  });
});

describe('wybór trafienia', () => {
  const miejsceKultu = {
    lat: '54.3407254',
    lon: '18.5598395',
    category: 'amenity',
    type: 'place_of_worship',
  };

  it('przyjmuje wyłącznie miejsce kultu', () => {
    expect(wybierzTrafienie([miejsceKultu])).toEqual({
      szerokosc: 54.3407254,
      dlugosc: 18.5598395,
    });
  });

  it('odrzuca trafienie, które nie jest miejscem kultu — bez zgadywania', () => {
    expect(
      wybierzTrafienie([{ lat: '54.34', lon: '18.55', category: 'building', type: 'apartments' }]),
    ).toBeNull();
    expect(wybierzTrafienie([])).toBeNull();
  });

  it('odrzuca współrzędne spoza Polski, choćby kategoria się zgadzała', () => {
    expect(
      wybierzTrafienie([
        { lat: '41.9022', lon: '12.4539', category: 'amenity', type: 'place_of_worship' },
      ]),
    ).toBeNull();
  });
});

describe('kafelki wokół punktu', () => {
  it('daje cztery sąsiadujące kafelki i pozycję punktu w ich obrębie', () => {
    const wynik = kafelkiWokol(54.3407254, 18.5598395, 16);
    expect(wynik.kafelki).toHaveLength(4);
    const [a, b, c, d] = wynik.kafelki;
    expect(b.x).toBe(a.x + 1);
    expect(b.y).toBe(a.y);
    expect(c.x).toBe(a.x);
    expect(c.y).toBe(a.y + 1);
    expect(d.x).toBe(a.x + 1);
    expect(d.y).toBe(a.y + 1);
  });

  it('punkt leży w środkowej połowie bloku 512 px, nigdy przy krawędzi', () => {
    for (const [lat, lon] of [
      [54.3407254, 18.5598395],
      [53.0138, 18.5984],
      [54.352, 18.6466],
    ]) {
      const { punkt } = kafelkiWokol(lat, lon, 16);
      expect(punkt.x).toBeGreaterThanOrEqual(128);
      expect(punkt.x).toBeLessThanOrEqual(384);
      expect(punkt.y).toBeGreaterThanOrEqual(128);
      expect(punkt.y).toBeLessThanOrEqual(384);
    }
  });

  it('jest deterministyczne — ten sam punkt daje ten sam blok', () => {
    expect(kafelkiWokol(54.35, 18.65, 16)).toEqual(kafelkiWokol(54.35, 18.65, 16));
  });
});
