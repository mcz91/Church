import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { glosSchema } from '../src/lib/glosy';
import { plikiAutora } from '../serwer/eksport.ts';
import {
  MODERATOR,
  formularz,
  srodowiskoTestowe,
  zarejestrujIZweryfikuj,
  zlozGlos,
  type Srodowisko,
} from './pomoc-serwis.ts';

// Dane jawnie fikcyjne — adresy wyłącznie w domenie przyklad.example.
const EMAIL = /[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)+/i;

function wszystkiePliki(katalog: string): string[] {
  return readdirSync(katalog, { recursive: true, withFileTypes: true })
    .filter((w) => w.isFile())
    .map((w) => join(w.parentPath, w.name));
}

async function zlozonyGlos(s: Srodowisko, adres = 'osoba@przyklad.example'): Promise<string> {
  const cookie = await zarejestrujIZweryfikuj(s, adres, 'Bywalec Testowy');
  await zlozGlos(s, cookie);
  const { id } = s.baza.prepare('SELECT id FROM glosy ORDER BY rowid DESC').get() as {
    id: string;
  };
  return id;
}

describe('panel moderacji', () => {
  it('jest niedostępny bez konta z allowlisty operatora', async () => {
    const s = srodowiskoTestowe();
    expect((await s.app.request('/moderacja')).status).toBe(401);
    const cookie = await zarejestrujIZweryfikuj(s, 'osoba@przyklad.example', 'Bywalec Testowy');
    expect((await s.app.request('/moderacja', { headers: { cookie } })).status).toBe(403);
  });

  it('approve eksportuje plik głosu przechodzący schemat i oznacza rekord', async () => {
    const s = srodowiskoTestowe();
    const idGlosu = await zlozonyGlos(s);
    const moderator = await zarejestrujIZweryfikuj(s, MODERATOR, 'Moderatorka');
    const init = formularz({ id: idGlosu });
    const odpowiedz = await s.app.request('/moderacja/przyjmij', {
      ...init,
      headers: { ...init.headers, cookie: moderator },
    });
    expect(odpowiedz.status).toBe(200);

    const pliki = wszystkiePliki(s.katalogEksportu);
    expect(pliki).toHaveLength(1);
    const zawartosc = JSON.parse(readFileSync(pliki[0], 'utf-8')) as { status: string };
    expect(glosSchema.safeParse(zawartosc).success).toBe(true);
    expect(zawartosc.status).toBe('approved');
    const { status } = s.baza.prepare('SELECT status FROM glosy WHERE id = ?').get(idGlosu) as {
      status: string;
    };
    expect(status).toBe('approved');
  });

  it('reject wymaga powodu i niczego nie eksportuje', async () => {
    const s = srodowiskoTestowe();
    const idGlosu = await zlozonyGlos(s);
    const moderator = await zarejestrujIZweryfikuj(s, MODERATOR, 'Moderatorka');

    const bezPowodu = formularz({ id: idGlosu });
    expect(
      (
        await s.app.request('/moderacja/odrzuc', {
          ...bezPowodu,
          headers: { ...bezPowodu.headers, cookie: moderator },
        })
      ).status,
    ).toBe(400);

    const zPowodem = formularz({ id: idGlosu, powod: 'treść spoza własnego doświadczenia' });
    expect(
      (
        await s.app.request('/moderacja/odrzuc', {
          ...zPowodem,
          headers: { ...zPowodem.headers, cookie: moderator },
        })
      ).status,
    ).toBe(200);

    const { status } = s.baza.prepare('SELECT status FROM glosy WHERE id = ?').get(idGlosu) as {
      status: string;
    };
    expect(status).toBe('rejected');
    expect(wszystkiePliki(s.katalogEksportu)).toHaveLength(0);
  });

  it('żadna ścieżka poza approve nie tworzy pliku w katalogu danych', async () => {
    const s = srodowiskoTestowe();
    const idGlosu = await zlozonyGlos(s);
    const moderator = await zarejestrujIZweryfikuj(s, MODERATOR, 'Moderatorka');
    const odrzucenie = formularz({ id: idGlosu, powod: 'spór doktrynalny, nie doświadczenie' });
    await s.app.request('/moderacja/odrzuc', {
      ...odrzucenie,
      headers: { ...odrzucenie.headers, cookie: moderator },
    });
    await s.app.request('/moderacja', { headers: { cookie: moderator } });
    expect(wszystkiePliki(s.katalogEksportu)).toHaveLength(0);
  });

  it('eksportowany plik nie zawiera adresu e-mail', async () => {
    const s = srodowiskoTestowe();
    const idGlosu = await zlozonyGlos(s);
    const moderator = await zarejestrujIZweryfikuj(s, MODERATOR, 'Moderatorka');
    const init = formularz({ id: idGlosu });
    await s.app.request('/moderacja/przyjmij', {
      ...init,
      headers: { ...init.headers, cookie: moderator },
    });
    for (const plik of wszystkiePliki(s.katalogEksportu)) {
      expect(readFileSync(plik, 'utf-8')).not.toMatch(EMAIL);
    }
  });
});

describe('usunięcie konta', () => {
  it('kasuje konto i głosy z bazy i wskazuje pliki autora; eksport autora po usunięciu jest pusty', async () => {
    const s = srodowiskoTestowe();
    const idGlosu = await zlozonyGlos(s);
    const { konto_id: kontoId } = s.baza
      .prepare('SELECT konto_id FROM glosy WHERE id = ?')
      .get(idGlosu) as { konto_id: string };
    const moderator = await zarejestrujIZweryfikuj(s, MODERATOR, 'Moderatorka');
    const przyjecie = formularz({ id: idGlosu });
    await s.app.request('/moderacja/przyjmij', {
      ...przyjecie,
      headers: { ...przyjecie.headers, cookie: moderator },
    });
    expect(plikiAutora(s.katalogEksportu, kontoId)).toHaveLength(1);

    const cookie = await zarejestrujIZweryfikuj(s, 'osoba@przyklad.example', 'Bywalec Testowy');
    const init = formularz({});
    const usuniecie = await s.app.request('/konto/usun', {
      ...init,
      headers: { ...init.headers, cookie },
    });
    expect(usuniecie.status).toBe(200);
    const tresc = await usuniecie.text();
    expect(tresc).toContain(`${kontoId}.json`);

    const konta = s.baza
      .prepare('SELECT COUNT(*) AS n FROM konta WHERE id = ?')
      .get(kontoId) as { n: number };
    const glosy = s.baza
      .prepare('SELECT COUNT(*) AS n FROM glosy WHERE konto_id = ?')
      .get(kontoId) as { n: number };
    expect(konta.n).toBe(0);
    expect(glosy.n).toBe(0);
    expect(plikiAutora(s.katalogEksportu, kontoId)).toHaveLength(0);
  });
});
