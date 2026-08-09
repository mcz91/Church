import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { Hono } from 'hono';
import { utworzAplikacje } from '../serwer/aplikacja.ts';
import type { DostawcaEmail } from '../serwer/email.ts';
import { otworzBaze } from '../serwer/baza.ts';

// Dane jawnie fikcyjne — adresy wyłącznie w domenie przyklad.example.
export const MODERATOR = 'moderatorka@przyklad.example';

export class EmailTestowy implements DostawcaEmail {
  wyslane: { adres: string; temat: string; tresc: string }[] = [];
  wyslij(adres: string, temat: string, tresc: string): Promise<void> {
    this.wyslane.push({ adres, temat, tresc });
    return Promise.resolve();
  }
}

export type Srodowisko = {
  app: Hono;
  baza: DatabaseSync;
  email: EmailTestowy;
  katalogEksportu: string;
  katalogMagazynu: string;
};

export function srodowiskoTestowe(): Srodowisko {
  const baza = otworzBaze(':memory:');
  const email = new EmailTestowy();
  const katalogEksportu = mkdtempSync(join(tmpdir(), 'glosy-eksport-'));
  const katalogMagazynu = mkdtempSync(join(tmpdir(), 'zdjecia-magazyn-'));
  const app = utworzAplikacje({
    baza,
    email,
    sekretSesji: 'sekret-testowy',
    moderatorzy: [MODERATOR],
    katalogEksportu,
    katalogMagazynu,
    bazowyUrl: 'http://localhost:8788',
  });
  return { app, baza, email, katalogEksportu, katalogMagazynu };
}

export function formularz(pola: Record<string, string>): RequestInit {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(pola).toString(),
  };
}

// Pełna droga konta: rejestracja → magic link z mocka → cookie sesji.
export async function zarejestrujIZweryfikuj(
  s: Srodowisko,
  adres: string,
  pseudonim: string,
  parafia = 'parafia-testowa-alfa',
): Promise<string> {
  const rejestracja = await s.app.request(
    '/rejestracja',
    formularz({ email: adres, pseudonim, parafia }),
  );
  if (rejestracja.status !== 200) throw new Error(`rejestracja: ${rejestracja.status}`);
  const list = s.email.wyslane.findLast((e) => e.adres === adres);
  if (!list) throw new Error('brak e-maila z magic linkiem');
  const token = /token=([a-z0-9-]+)/i.exec(list.tresc)?.[1];
  if (!token) throw new Error('brak tokenu w treści e-maila');
  const weryfikacja = await s.app.request(`/weryfikacja?token=${token}`);
  const cookie = weryfikacja.headers.get('set-cookie')?.split(';')[0];
  if (!cookie) throw new Error('brak cookie sesji po weryfikacji');
  return cookie;
}

export async function zlozGlos(
  s: Srodowisko,
  cookie: string,
  parafia = 'parafia-testowa-alfa',
  nadpisz: Record<string, string> = {},
): Promise<Response> {
  const init = formularz({
    parafia,
    ocenaOgolna: '5',
    przyjecie: '5',
    muzyka: '4',
    zDziecmi: '5',
    dostepnosc: '4',
    organizacja: '5',
    tekst: 'Testowy głos o testowej parafii.',
    ...nadpisz,
  });
  return await s.app.request('/glos', { ...init, headers: { ...init.headers, cookie } });
}
