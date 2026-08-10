import { beforeEach, describe, expect, it } from 'vitest';
import { MODERATOR, srodowiskoTestowe } from './pomoc-serwis.ts';
import type { Srodowisko } from './pomoc-serwis.ts';

// Wcześniej głos wymagał wizyty w skrzynce pocztowej, ZANIM dało się
// cokolwiek napisać: najpierw link, dopiero po kliknięciu formularz.
// Teraz treść powstaje od razu, a adres potwierdza się po wysłaniu.
// Doktryna dokumentu 03 zostaje: autor ma zweryfikowany e-mail,
// publikacja wyłącznie po moderacji — zmienia się wyłącznie kolejność.
// Dane jawnie fikcyjne: adresy wyłącznie w domenie przyklad.example.

const glosOdRazu = (nadpisania: Record<string, string> = {}): FormData => {
  const dane = new FormData();
  const pola: Record<string, string> = {
    parafia: 'parafia-testowa-alfa',
    email: 'gosc@przyklad.example',
    pseudonim: 'Gość Testowy',
    ocenaOgolna: '5',
    przyjecie: '5',
    muzyka: '4',
    zDziecmi: '4',
    dostepnosc: '3',
    organizacja: '4',
    tekst: 'Testowe doświadczenie napisane od razu.',
    ...nadpisania,
  };
  for (const [klucz, wartosc] of Object.entries(pola)) dane.set(klucz, wartosc);
  return dane;
};

describe('głos bez wcześniejszego logowania', () => {
  let s: Srodowisko;
  beforeEach(() => {
    s = srodowiskoTestowe();
  });

  it('przyjmuje treść od gościa i dopiero wtedy wysyła link potwierdzający', async () => {
    const odpowiedz = await s.app.request('/glos', { method: 'POST', body: glosOdRazu() });
    expect(odpowiedz.status).toBe(200);

    const zapisane = s.baza.prepare('SELECT status, tekst FROM glosy').all() as {
      status: string;
      tekst: string;
    }[];
    expect(zapisane).toHaveLength(1);
    expect(zapisane[0].status).toBe('pending');
    expect(zapisane[0].tekst).toBe('Testowe doświadczenie napisane od razu.');
    expect(s.email.wyslane).toHaveLength(1);
    expect(s.email.wyslane[0].adres).toBe('gosc@przyklad.example');
  });

  it('konto gościa do czasu kliknięcia linku pozostaje niezweryfikowane', async () => {
    await s.app.request('/glos', { method: 'POST', body: glosOdRazu() });
    const konto = s.baza.prepare('SELECT zweryfikowane FROM konta').get() as {
      zweryfikowane: number;
    };
    expect(konto.zweryfikowane).toBe(0);
  });

  it('głos od niepotwierdzonego adresu nie da się przyjąć do publikacji', async () => {
    await s.app.request('/glos', { method: 'POST', body: glosOdRazu() });
    const { id } = s.baza.prepare('SELECT id FROM glosy').get() as { id: string };

    const ciasteczko = await zalogujModeratora(s);
    const cialo = new FormData();
    cialo.set('id', id);
    const odpowiedz = await s.app.request('/moderacja/przyjmij', {
      method: 'POST',
      body: cialo,
      headers: { cookie: ciasteczko },
    });

    expect(odpowiedz.status).toBe(409);
    const status = s.baza.prepare('SELECT status FROM glosy WHERE id = ?').get(id) as {
      status: string;
    };
    expect(status.status).toBe('pending');
  });

  it('po kliknięciu linku głos czeka na moderację i daje się przyjąć', async () => {
    await s.app.request('/glos', { method: 'POST', body: glosOdRazu() });
    const token = /token=([\w-]+)/.exec(s.email.wyslane[0].tresc)?.[1] ?? '';
    expect(token).not.toBe('');
    await s.app.request(`/weryfikacja?token=${token}`);

    const konto = s.baza.prepare('SELECT zweryfikowane FROM konta').get() as {
      zweryfikowane: number;
    };
    expect(konto.zweryfikowane).toBe(1);

    const { id } = s.baza.prepare('SELECT id FROM glosy').get() as { id: string };
    const ciasteczko = await zalogujModeratora(s);
    const cialo = new FormData();
    cialo.set('id', id);
    const odpowiedz = await s.app.request('/moderacja/przyjmij', {
      method: 'POST',
      body: cialo,
      headers: { cookie: ciasteczko },
    });
    expect(odpowiedz.status).toBe(200);
  });

  it('gość bez adresu albo bez pseudonimu dostaje wskazanie brakującego pola', async () => {
    const bezAdresu = await s.app.request('/glos', {
      method: 'POST',
      body: glosOdRazu({ email: '' }),
    });
    expect(bezAdresu.status).toBe(400);
    expect(await bezAdresu.text()).toMatch(/e-mail/i);
    expect(s.baza.prepare('SELECT count(*) AS ile FROM glosy').get()).toEqual({ ile: 0 });
  });
});

async function zalogujModeratora(s: Srodowisko): Promise<string> {
  const dane = new FormData();
  dane.set('email', MODERATOR);
  dane.set('pseudonim', 'Moderatorka');
  await s.app.request('/rejestracja', { method: 'POST', body: dane });
  const token = /token=([\w-]+)/.exec(s.email.wyslane.at(-1)!.tresc)?.[1] ?? '';
  const odpowiedz = await s.app.request(`/weryfikacja?token=${token}`);
  s.email.wyslane.length = 0;
  return odpowiedz.headers.get('set-cookie')?.split(';')[0] ?? '';
}
