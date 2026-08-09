// Obsługa obrazów bez zależności (docs/10): wyłącznie JPEG i PNG,
// wymiary czytane z nagłówków bez dekodowania pikseli, metadane usuwane
// deterministyczną reserializacją strumienia. Prywatność autora leży na
// tej ścieżce — EXIF (geolokalizacja, dane urządzenia) nie może przejść.

export const LIMIT_BAJTOW = 8 * 1024 * 1024;
export const LIMIT_DLUZSZEGO_BOKU = 8192;

export type FormatObrazu = 'jpeg' | 'png';

const SYGNATURA_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function rozpoznajFormat(dane: Buffer): FormatObrazu | null {
  if (dane.length > 3 && dane[0] === 0xff && dane[1] === 0xd8 && dane[2] === 0xff) return 'jpeg';
  if (dane.length > 8 && dane.subarray(0, 8).equals(SYGNATURA_PNG)) return 'png';
  return null;
}

type Segment = { marker: number; start: number; koniec: number };

// Segmenty JPEG od SOI do SOS; dane entropijne za SOS traktujemy jako
// nietykalny strumień obrazu.
function segmentyJPEG(dane: Buffer): { segmenty: Segment[]; strumien: number } | null {
  let i = 2;
  const segmenty: Segment[] = [];
  while (i + 4 <= dane.length) {
    if (dane[i] !== 0xff) return null;
    const marker = dane[i + 1];
    if (marker === 0xda) return { segmenty, strumien: i }; // SOS
    const dlugosc = dane.readUInt16BE(i + 2);
    segmenty.push({ marker, start: i, koniec: i + 2 + dlugosc });
    i += 2 + dlugosc;
  }
  return null;
}

export function wymiaryObrazu(dane: Buffer): { szerokosc: number; wysokosc: number } | null {
  const format = rozpoznajFormat(dane);
  if (format === 'png') {
    if (dane.length < 24 || dane.toString('latin1', 12, 16) !== 'IHDR') return null;
    return { szerokosc: dane.readUInt32BE(16), wysokosc: dane.readUInt32BE(20) };
  }
  if (format === 'jpeg') {
    const wynik = segmentyJPEG(dane);
    if (!wynik) return null;
    const SOF = new Set([0xc0, 0xc1, 0xc2, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
    for (const segment of wynik.segmenty) {
      if (SOF.has(segment.marker)) {
        return {
          wysokosc: dane.readUInt16BE(segment.start + 5),
          szerokosc: dane.readUInt16BE(segment.start + 7),
        };
      }
    }
  }
  return null;
}

export function usunMetadaneJPEG(dane: Buffer): Buffer {
  const wynik = segmentyJPEG(dane);
  if (!wynik) return dane;
  const czesci: Buffer[] = [dane.subarray(0, 2)];
  for (const segment of wynik.segmenty) {
    // APP1–APP15 (0xE1–0xEF) i COM (0xFE) niosą metadane — wypadają.
    if ((segment.marker >= 0xe1 && segment.marker <= 0xef) || segment.marker === 0xfe) continue;
    czesci.push(dane.subarray(segment.start, segment.koniec));
  }
  czesci.push(dane.subarray(wynik.strumien));
  return Buffer.concat(czesci);
}

const CHUNKI_METADANYCH = new Set(['eXIf', 'tEXt', 'iTXt', 'zTXt']);

export function usunMetadanePNG(dane: Buffer): Buffer {
  const czesci: Buffer[] = [dane.subarray(0, 8)];
  let i = 8;
  while (i + 8 <= dane.length) {
    const dlugosc = dane.readUInt32BE(i);
    const typ = dane.toString('latin1', i + 4, i + 8);
    const koniec = i + 12 + dlugosc;
    if (!CHUNKI_METADANYCH.has(typ)) czesci.push(dane.subarray(i, koniec));
    if (typ === 'IEND') break;
    i = koniec;
  }
  return Buffer.concat(czesci);
}

export function oczyscObraz(dane: Buffer): { format: FormatObrazu; dane: Buffer } | null {
  if (dane.length > LIMIT_BAJTOW) return null;
  const format = rozpoznajFormat(dane);
  if (!format) return null;
  const wymiary = wymiaryObrazu(dane);
  if (!wymiary || Math.max(wymiary.szerokosc, wymiary.wysokosc) > LIMIT_DLUZSZEGO_BOKU) return null;
  return {
    format,
    dane: format === 'jpeg' ? usunMetadaneJPEG(dane) : usunMetadanePNG(dane),
  };
}
