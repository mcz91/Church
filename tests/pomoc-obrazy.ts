import { crc32, deflateSync } from 'node:zlib';

// Syntetyczne obrazy do testów (docs/10, uwagi wykonawcze): generowane
// programowo, jawnie fikcyjne — jednolite kolory, syntetyczny EXIF,
// żadnych realnych fotografii ani realnych współrzędnych.

function chunkPNG(typ: string, dane: Buffer): Buffer {
  const dlugosc = Buffer.alloc(4);
  dlugosc.writeUInt32BE(dane.length);
  const tresc = Buffer.concat([Buffer.from(typ, 'latin1'), dane]);
  const suma = Buffer.alloc(4);
  suma.writeUInt32BE(crc32(tresc) >>> 0);
  return Buffer.concat([dlugosc, tresc, suma]);
}

export function syntetycznyPNG(
  szerokosc = 4,
  wysokosc = 3,
  dodatkowe: { typ: string; dane: Buffer }[] = [],
): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(szerokosc, 0);
  ihdr.writeUInt32BE(wysokosc, 4);
  ihdr[8] = 8; // głębia
  ihdr[9] = 2; // truecolor
  const wiersz = Buffer.concat([Buffer.from([0]), Buffer.alloc(szerokosc * 3, 0x66)]);
  const idat = deflateSync(Buffer.concat(Array.from({ length: wysokosc }, () => wiersz)));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunkPNG('IHDR', ihdr),
    ...dodatkowe.map((c) => chunkPNG(c.typ, c.dane)),
    chunkPNG('IDAT', idat),
    chunkPNG('IEND', Buffer.alloc(0)),
  ]);
}

function segmentJPEG(marker: number, dane: Buffer): Buffer {
  const naglowek = Buffer.alloc(4);
  naglowek[0] = 0xff;
  naglowek[1] = marker;
  naglowek.writeUInt16BE(dane.length + 2, 2);
  return Buffer.concat([naglowek, dane]);
}

// Syntetyczny EXIF: znaczniki tekstowe do asercji, zero realnych danych.
export const SYNTETYCZNY_EXIF = Buffer.from(
  'Exif\0\0SYNTETYCZNE-GPS LAT 00.0000 LON 00.0000 APARAT TESTOWY',
  'latin1',
);

export function syntetycznyJPEG(
  opcje: { app1?: Buffer; komentarz?: string; szerokosc?: number; wysokosc?: number } = {},
): Buffer {
  const { app1, komentarz, szerokosc = 4, wysokosc = 3 } = opcje;
  const sof = Buffer.alloc(15);
  sof[0] = 8; // precyzja
  sof.writeUInt16BE(wysokosc, 1);
  sof.writeUInt16BE(szerokosc, 3);
  sof[5] = 3; // składowe
  const czesci = [
    Buffer.from([0xff, 0xd8]), // SOI
    segmentJPEG(0xe0, Buffer.from('JFIF\0', 'latin1')), // APP0 zostaje
    ...(app1 ? [segmentJPEG(0xe1, app1)] : []),
    ...(komentarz ? [segmentJPEG(0xfe, Buffer.from(komentarz, 'latin1'))] : []),
    segmentJPEG(0xc0, sof), // SOF0
    segmentJPEG(0xda, Buffer.from([1, 1, 0, 0, 63, 0])), // SOS
    Buffer.from([0x12, 0x34, 0x56]), // dane entropijne (syntetyczne)
    Buffer.from([0xff, 0xd9]), // EOI
  ];
  return Buffer.concat(czesci);
}
