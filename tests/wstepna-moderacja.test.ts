import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { klasyfikujGlos } from '../serwer/moderacja-wstepna.ts';
import { MODERATOR, srodowiskoTestowe, zarejestrujIZweryfikuj, zlozGlos } from './pomoc-serwis.ts';

// Dane jawnie fikcyjne — treści testowe, numer telefonu z puli fikcyjnej.

describe('klasyfikator regułowy (czysta funkcja)', () => {
  it('numer telefonu w tekście publicznym to przypadek twardy', () => {
    const wynik = klasyfikujGlos({ tekst: 'Polecam, zadzwońcie do kancelarii: 501 234 567.' });
    expect(wynik.twarde.length).toBeGreaterThan(0);
    expect(wynik.twarde[0].powod).toMatch(/telefon|kontakt/i);
  });

  it('wulgaryzm z listy to przypadek twardy', () => {
    const wynik = klasyfikujGlos({ tekst: 'organista grał chujowo' });
    expect(wynik.twarde.length).toBeGreaterThan(0);
  });

  it('fraza porównująca wyznania to przypadek graniczny — podpowiedź, nie odrzucenie', () => {
    const wynik = klasyfikujGlos({ tekst: 'Ta parafia jest lepsza niż wspólnoty prawosławne.' });
    expect(wynik.twarde).toEqual([]);
    expect(wynik.podpowiedzi.length).toBeGreaterThan(0);
  });

  it('czysty głos nie dostaje ani odrzucenia, ani podpowiedzi', () => {
    const wynik = klasyfikujGlos({ tekst: 'Msza o 7:00 jest cicha i krótka, w sam raz przed pracą.' });
    expect(wynik.twarde).toEqual([]);
    expect(wynik.podpowiedzi).toEqual([]);
  });
});

describe('wstępna moderacja w serwisie zapisu', () => {
  it('twardy przypadek automat odrzuca z powodem i flagą odwołania', async () => {
    const s = srodowiskoTestowe();
    const cookie = await zarejestrujIZweryfikuj(s, 'osoba@przyklad.example', 'Bywalec Testowy');
    const odpowiedz = await zlozGlos(s, cookie, 'parafia-testowa-alfa', {
      tekst: 'Świetna parafia, mój numer: 501 234 567.',
    });
    expect(odpowiedz.status).toBe(200);
    const tekst = await odpowiedz.text();
    expect(tekst).toMatch(/odrzuc/i);
    expect(tekst).toMatch(/odwoła/i);
    const wiersz = s.baza
      .prepare('SELECT status, powod_odrzucenia, auto_odrzucone FROM glosy')
      .get() as { status: string; powod_odrzucenia: string | null; auto_odrzucone: number };
    expect(wiersz.status).toBe('rejected');
    expect(wiersz.powod_odrzucenia).toBeTruthy();
    expect(wiersz.auto_odrzucone).toBe(1);
  });

  it('przypadek graniczny zostaje pending z podpowiedzią widoczną w panelu', async () => {
    const s = srodowiskoTestowe();
    const cookie = await zarejestrujIZweryfikuj(s, 'osoba@przyklad.example', 'Bywalec Testowy');
    await zlozGlos(s, cookie, 'parafia-testowa-alfa', {
      tekst: 'Nasza parafia jest lepsza niż inne wyznania w okolicy.',
    });
    const { status } = s.baza.prepare('SELECT status FROM glosy').get() as { status: string };
    expect(status).toBe('pending');
    const moderator = await zarejestrujIZweryfikuj(s, MODERATOR, 'Moderatorka');
    const panel = await (await s.app.request('/moderacja', { headers: { cookie: moderator } })).text();
    expect(panel).toMatch(/podpowied/i);
  });

  it('żadna ścieżka automatu nie ustawia approved ani nie tworzy pliku w katalogu danych', async () => {
    const s = srodowiskoTestowe();
    const cookie = await zarejestrujIZweryfikuj(s, 'osoba@przyklad.example', 'Bywalec Testowy');
    await zlozGlos(s, cookie, 'parafia-testowa-alfa', { tekst: 'Czysty testowy głos.' });
    await zlozGlos(s, cookie, 'parafia-testowa-beta', { tekst: 'Numer do mnie: 501 234 567.' });
    await zlozGlos(s, cookie, 'parafia-testowa-gamma', { tekst: 'Lepsza niż parafie innych wyznań.' });
    const statusy = (s.baza.prepare('SELECT status FROM glosy').all() as { status: string }[]).map(
      (w) => w.status,
    );
    expect(statusy).toHaveLength(3);
    expect(statusy).not.toContain('approved');
    expect(readdirSync(s.katalogEksportu, { recursive: true })).toHaveLength(0);
  });
});
