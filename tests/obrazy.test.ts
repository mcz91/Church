import { describe, expect, it } from 'vitest';
import {
  LIMIT_BAJTOW,
  LIMIT_DLUZSZEGO_BOKU,
  oczyscObraz,
  rozpoznajFormat,
  usunMetadaneJPEG,
  usunMetadanePNG,
  wymiaryObrazu,
} from '../serwer/obrazy.ts';
import { SYNTETYCZNY_EXIF, syntetycznyJPEG, syntetycznyPNG } from './pomoc-obrazy.ts';

describe('rozpoznawanie formatu i wymiarów z nagłówków', () => {
  it('rozpoznaje JPEG i PNG po sygnaturze; inne dane odrzuca', () => {
    expect(rozpoznajFormat(syntetycznyJPEG())).toBe('jpeg');
    expect(rozpoznajFormat(syntetycznyPNG())).toBe('png');
    expect(rozpoznajFormat(Buffer.from('GIF89a...'))).toBeNull();
  });

  it('czyta wymiary z nagłówków bez dekodowania pikseli', () => {
    expect(wymiaryObrazu(syntetycznyPNG(320, 240))).toEqual({ szerokosc: 320, wysokosc: 240 });
    expect(wymiaryObrazu(syntetycznyJPEG({ szerokosc: 640, wysokosc: 480 }))).toEqual({
      szerokosc: 640,
      wysokosc: 480,
    });
  });
});

describe('usuwanie metadanych JPEG', () => {
  const zExif = syntetycznyJPEG({ app1: SYNTETYCZNY_EXIF, komentarz: 'komentarz aparatu' });

  it('usuwa segmenty APP1–APP15 i komentarze', () => {
    const czysty = usunMetadaneJPEG(zExif);
    expect(czysty.includes(Buffer.from('SYNTETYCZNE-GPS', 'latin1'))).toBe(false);
    expect(czysty.includes(Buffer.from('komentarz aparatu', 'latin1'))).toBe(false);
  });

  it('zachowuje strumień obrazu bajtowo nienaruszony', () => {
    const czysty = usunMetadaneJPEG(zExif);
    const bezMetadanych = syntetycznyJPEG();
    expect(czysty.equals(bezMetadanych)).toBe(true);
  });
});

describe('usuwanie metadanych PNG', () => {
  const zMetadanymi = syntetycznyPNG(4, 3, [
    { typ: 'eXIf', dane: SYNTETYCZNY_EXIF },
    { typ: 'tEXt', dane: Buffer.from('Author\0Osoba Testowa', 'latin1') },
    { typ: 'iTXt', dane: Buffer.from('Comment\0\0\0\0\0syntetyczny', 'latin1') },
  ]);

  it('usuwa chunki eXIf, tEXt, iTXt, zTXt', () => {
    const czysty = usunMetadanePNG(zMetadanymi);
    expect(czysty.includes(Buffer.from('SYNTETYCZNE-GPS', 'latin1'))).toBe(false);
    expect(czysty.includes(Buffer.from('Osoba Testowa', 'latin1'))).toBe(false);
  });

  it('zachowuje strumień obrazu bajtowo nienaruszony', () => {
    expect(usunMetadanePNG(zMetadanymi).equals(syntetycznyPNG(4, 3))).toBe(true);
  });
});

describe('przyjęcie obrazu', () => {
  it('czyści metadane i zwraca format', () => {
    const wynik = oczyscObraz(syntetycznyJPEG({ app1: SYNTETYCZNY_EXIF }));
    expect(wynik?.format).toBe('jpeg');
    expect(wynik?.dane.includes(Buffer.from('SYNTETYCZNE-GPS', 'latin1'))).toBe(false);
  });

  it('odrzuca nieznany format, nadmiar bajtów i za długi bok', () => {
    expect(oczyscObraz(Buffer.from('nie-obraz'))).toBeNull();
    expect(LIMIT_BAJTOW).toBe(8 * 1024 * 1024);
    expect(oczyscObraz(syntetycznyPNG(LIMIT_DLUZSZEGO_BOKU + 1, 10))).toBeNull();
  });
});
