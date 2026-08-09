import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { glosSchema } from '../src/lib/glosy';
import { plikiAutora } from '../serwer/eksport.ts';
import {
  MODERATOR,
  formularz,
  srodowiskoTestowe,
  zarejestrujIZweryfikuj,
  type Srodowisko,
} from './pomoc-serwis.ts';
import { SYNTETYCZNY_EXIF, syntetycznyJPEG, syntetycznyPNG } from './pomoc-obrazy.ts';

// Zdjęcia w głosach (docs/10): przyjmowane wyłącznie z głosem, czyszczone
// z metadanych przed zapisem do magazynu, publikowane wyłącznie drogą
// approve człowieka. Obrazy syntetyczne — żadnych realnych fotografii.

const pliki = (katalog: string) =>
  readdirSync(katalog, { recursive: true, withFileTypes: true })
    .filter((w) => w.isFile())
    .map((w) => join(w.parentPath, w.name));

async function zlozGlosZeZdjeciem(
  s: Srodowisko,
  cookie: string,
  obraz: { dane: Buffer; nazwa: string; typ: string } | null,
  nadpisz: Record<string, string> = {},
): Promise<Response> {
  const dane = new FormData();
  const pola: Record<string, string> = {
    parafia: 'parafia-testowa-alfa',
    ocenaOgolna: '5',
    przyjecie: '5',
    muzyka: '4',
    zDziecmi: '5',
    dostepnosc: '4',
    organizacja: '5',
    tekst: 'Testowy głos ze zdjęciem.',
    zdjecieAlt1: 'wnętrze testowego kościoła',
    zdjeciePodpis1: 'nawa główna',
    ...nadpisz,
  };
  for (const [k, v] of Object.entries(pola)) dane.set(k, v);
  if (obraz) {
    dane.set('zdjecie1', new File([new Uint8Array(obraz.dane)], obraz.nazwa, { type: obraz.typ }));
  }
  return await s.app.request('/glos', { method: 'POST', headers: { cookie }, body: dane });
}

async function przyjmij(s: Srodowisko, idGlosu: string): Promise<Response> {
  const moderator = await zarejestrujIZweryfikuj(s, MODERATOR, 'Moderatorka');
  const init = formularz({ id: idGlosu });
  return await s.app.request('/moderacja/przyjmij', {
    ...init,
    headers: { ...init.headers, cookie: moderator },
  });
}

const idOstatniegoGlosu = (s: Srodowisko) =>
  (s.baza.prepare('SELECT id FROM glosy ORDER BY rowid DESC').get() as { id: string }).id;

describe('przyjmowanie zdjęcia z głosem', () => {
  it('zapisuje zdjęcie w magazynie przed odpowiedzią, po usunięciu metadanych', async () => {
    const s = srodowiskoTestowe();
    const cookie = await zarejestrujIZweryfikuj(s, 'osoba@przyklad.example', 'Bywalec Testowy');
    const odpowiedz = await zlozGlosZeZdjeciem(s, cookie, {
      dane: syntetycznyJPEG({ app1: SYNTETYCZNY_EXIF, komentarz: 'aparat testowy' }),
      nazwa: 'IMG_9999.jpg',
      typ: 'image/jpeg',
    });
    expect(odpowiedz.status).toBe(200);
    const zapisane = pliki(s.katalogMagazynu);
    expect(zapisane).toHaveLength(1);
    const zawartosc = readFileSync(zapisane[0]);
    expect(zawartosc.includes(Buffer.from('SYNTETYCZNE-GPS', 'latin1'))).toBe(false);
    expect(zapisane[0]).not.toContain('IMG_9999');
    const wiersz = s.baza.prepare('SELECT alt, podpis FROM zdjecia').get() as {
      alt: string;
      podpis: string;
    };
    expect(wiersz.alt).toBe('wnętrze testowego kościoła');
  });

  it('odrzuca z powodem format spoza JPEG/PNG i plik ponad limit', async () => {
    const s = srodowiskoTestowe();
    const cookie = await zarejestrujIZweryfikuj(s, 'osoba@przyklad.example', 'Bywalec Testowy');
    const zly = await zlozGlosZeZdjeciem(s, cookie, {
      dane: Buffer.from('GIF89a-nie-obraz'),
      nazwa: 'obraz.gif',
      typ: 'image/gif',
    });
    expect(zly.status).toBe(400);
    expect(pliki(s.katalogMagazynu)).toHaveLength(0);
    const zaDuzy = await zlozGlosZeZdjeciem(s, cookie, {
      dane: Buffer.concat([syntetycznyPNG(), Buffer.alloc(8 * 1024 * 1024, 1)]),
      nazwa: 'duzy.png',
      typ: 'image/png',
    });
    expect(zaDuzy.status).toBe(400);
    expect(pliki(s.katalogMagazynu)).toHaveLength(0);
  });

  it('wymaga tekstu alternatywnego przy zdjęciu', async () => {
    const s = srodowiskoTestowe();
    const cookie = await zarejestrujIZweryfikuj(s, 'osoba@przyklad.example', 'Bywalec Testowy');
    const bezAlt = await zlozGlosZeZdjeciem(
      s,
      cookie,
      { dane: syntetycznyPNG(), nazwa: 'foto.png', typ: 'image/png' },
      { zdjecieAlt1: '' },
    );
    expect(bezAlt.status).toBe(400);
    expect(pliki(s.katalogMagazynu)).toHaveLength(0);
  });
});

describe('publikacja wyłącznie drogą approve', () => {
  it('approve kopiuje zdjęcia do repo obok pliku głosu; rekord przechodzi schemat', async () => {
    const s = srodowiskoTestowe();
    const cookie = await zarejestrujIZweryfikuj(s, 'osoba@przyklad.example', 'Bywalec Testowy');
    await zlozGlosZeZdjeciem(s, cookie, {
      dane: syntetycznyJPEG({ app1: SYNTETYCZNY_EXIF }),
      nazwa: 'IMG_0001.jpg',
      typ: 'image/jpeg',
    });
    expect((await przyjmij(s, idOstatniegoGlosu(s))).status).toBe(200);
    const wyeksportowane = pliki(s.katalogEksportu);
    const json = wyeksportowane.find((p) => p.endsWith('.json'))!;
    const obraz = wyeksportowane.find((p) => p.endsWith('.jpg'))!;
    expect(obraz).toBeTruthy();
    const glos = glosSchema.parse(JSON.parse(readFileSync(json, 'utf-8')));
    expect(glos.zdjecia).toHaveLength(1);
    expect(obraz.endsWith(`/${glos.zdjecia![0].plik}`)).toBe(true);
    expect(readFileSync(obraz).includes(Buffer.from('SYNTETYCZNE-GPS', 'latin1'))).toBe(false);
  });

  it('reject usuwa zdjęcia z magazynu trwale i niczego nie publikuje', async () => {
    const s = srodowiskoTestowe();
    const cookie = await zarejestrujIZweryfikuj(s, 'osoba@przyklad.example', 'Bywalec Testowy');
    await zlozGlosZeZdjeciem(s, cookie, { dane: syntetycznyPNG(), nazwa: 'f.png', typ: 'image/png' });
    const moderator = await zarejestrujIZweryfikuj(s, MODERATOR, 'Moderatorka');
    const init = formularz({ id: idOstatniegoGlosu(s), powod: 'treść spoza doświadczenia' });
    await s.app.request('/moderacja/odrzuc', { ...init, headers: { ...init.headers, cookie: moderator } });
    expect(pliki(s.katalogMagazynu)).toHaveLength(0);
    expect(pliki(s.katalogEksportu)).toHaveLength(0);
  });

  it('moderator może odrzucić same zdjęcia — głos zostaje w kolejce bez zdjęć', async () => {
    const s = srodowiskoTestowe();
    const cookie = await zarejestrujIZweryfikuj(s, 'osoba@przyklad.example', 'Bywalec Testowy');
    await zlozGlosZeZdjeciem(s, cookie, { dane: syntetycznyPNG(), nazwa: 'f.png', typ: 'image/png' });
    const idGlosu = idOstatniegoGlosu(s);
    const moderator = await zarejestrujIZweryfikuj(s, MODERATOR, 'Moderatorka');
    const init = formularz({ id: idGlosu, powod: 'rozpoznawalne osoby na zdjęciu' });
    const odpowiedz = await s.app.request('/moderacja/odrzuc-zdjecia', {
      ...init,
      headers: { ...init.headers, cookie: moderator },
    });
    expect(odpowiedz.status).toBe(200);
    expect(pliki(s.katalogMagazynu)).toHaveLength(0);
    const { status } = s.baza.prepare('SELECT status FROM glosy WHERE id = ?').get(idGlosu) as {
      status: string;
    };
    expect(status).toBe('pending');
    const { n } = s.baza.prepare('SELECT COUNT(*) AS n FROM zdjecia').get() as { n: number };
    expect(n).toBe(0);
  });

  it('panel pokazuje zdjęcia oczekujące z zasadą „miejsce, nie ludzie" i podpisem', async () => {
    const s = srodowiskoTestowe();
    const cookie = await zarejestrujIZweryfikuj(s, 'osoba@przyklad.example', 'Bywalec Testowy');
    await zlozGlosZeZdjeciem(s, cookie, { dane: syntetycznyPNG(), nazwa: 'f.png', typ: 'image/png' });
    const moderator = await zarejestrujIZweryfikuj(s, MODERATOR, 'Moderatorka');
    const panel = await (await s.app.request('/moderacja', { headers: { cookie: moderator } })).text();
    expect(panel).toMatch(/miejsce, nie lud/i);
    expect(panel).toContain('nawa główna');
  });
});

describe('usunięcie konta obejmuje zdjęcia', () => {
  it('czyści magazyn i wskazuje pliki obrazów autora do zdjęcia z repo', async () => {
    const s = srodowiskoTestowe();
    const cookie = await zarejestrujIZweryfikuj(s, 'osoba@przyklad.example', 'Bywalec Testowy');
    await zlozGlosZeZdjeciem(s, cookie, { dane: syntetycznyPNG(), nazwa: 'f.png', typ: 'image/png' });
    const idGlosu = idOstatniegoGlosu(s);
    const { konto_id: kontoId } = s.baza
      .prepare('SELECT konto_id FROM glosy WHERE id = ?')
      .get(idGlosu) as { konto_id: string };
    await przyjmij(s, idGlosu);
    expect(plikiAutora(s.katalogEksportu, kontoId).length).toBeGreaterThanOrEqual(2);

    const sesja = await zarejestrujIZweryfikuj(s, 'osoba@przyklad.example', 'Bywalec Testowy');
    const init = formularz({});
    const odpowiedz = await s.app.request('/konto/usun', {
      ...init,
      headers: { ...init.headers, cookie: sesja },
    });
    const tresc = await odpowiedz.text();
    expect(tresc).toMatch(/\.(jpg|png)/);
    expect(pliki(s.katalogMagazynu)).toHaveLength(0);
    expect(plikiAutora(s.katalogEksportu, kontoId)).toHaveLength(0);
  });
});
