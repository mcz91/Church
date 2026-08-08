import { describe, expect, it } from 'vitest';
import { MODERATOR, formularz, srodowiskoTestowe, zarejestrujIZweryfikuj } from './pomoc-serwis.ts';

// Dane jawnie fikcyjne — adresy wyłącznie w domenie przyklad.example.

describe('zgłoszenie błędu faktu', () => {
  it('formularz zgłoszenia jest dostępny bez konta i działa zwykłym POST-em', async () => {
    const s = srodowiskoTestowe();
    const strona = await s.app.request('/blad/miasto-przykladowe/parafia-testowa-alfa');
    expect(strona.status).toBe(200);
    const html = await strona.text();
    expect(html).toContain('method="post"');
    expect(html).toContain('parafia-testowa-alfa');
  });

  it('zapisuje zgłoszenie trwale w bazie przed odpowiedzią', async () => {
    const s = srodowiskoTestowe();
    const odpowiedz = await s.app.request(
      '/blad',
      formularz({
        karta: '/parafia/miasto-przykladowe/parafia-testowa-alfa',
        tresc: 'Testowa godzina mszy jest nieaktualna.',
      }),
    );
    expect(odpowiedz.status).toBe(200);
    const wiersz = s.baza.prepare('SELECT karta, tresc, status FROM zgloszenia').get() as {
      karta: string;
      tresc: string;
      status: string;
    };
    expect(wiersz.karta).toBe('/parafia/miasto-przykladowe/parafia-testowa-alfa');
    expect(wiersz.tresc).toBe('Testowa godzina mszy jest nieaktualna.');
    expect(wiersz.status).toBe('otwarte');
  });

  it('odrzuca zgłoszenie bez treści', async () => {
    const s = srodowiskoTestowe();
    const odpowiedz = await s.app.request('/blad', formularz({ karta: '/parafia/x/y', tresc: ' ' }));
    expect(odpowiedz.status).toBe(400);
    const { n } = s.baza.prepare('SELECT COUNT(*) AS n FROM zgloszenia').get() as { n: number };
    expect(n).toBe(0);
  });
});

describe('kolejka moderacji w panelu', () => {
  it('pokazuje zgłoszenie z adresem karty i treścią oraz rozmiar i wiek kolejki', async () => {
    const s = srodowiskoTestowe();
    await s.app.request(
      '/blad',
      formularz({ karta: '/parafia/miasto-przykladowe/parafia-testowa-alfa', tresc: 'Testowy błąd faktu.' }),
    );
    const moderator = await zarejestrujIZweryfikuj(s, MODERATOR, 'Moderatorka');
    const panel = await s.app.request('/moderacja', { headers: { cookie: moderator } });
    const html = await panel.text();
    expect(html).toContain('/parafia/miasto-przykladowe/parafia-testowa-alfa');
    expect(html).toContain('Testowy błąd faktu.');
    expect(html).toMatch(/kolejka/i);
    expect(html).toMatch(/najstarsz/i);
  });
});
