import { describe, expect, it } from 'vitest';
import {
  formularz,
  srodowiskoTestowe,
  zarejestrujIZweryfikuj,
  zlozGlos,
} from './pomoc-serwis.ts';

// Dane jawnie fikcyjne — adresy wyłącznie w domenie przyklad.example.

describe('rejestracja i weryfikacja', () => {
  it('wysyła magic link przez interfejs dostawcy e-mail', async () => {
    const s = srodowiskoTestowe();
    const odpowiedz = await s.app.request(
      '/rejestracja',
      formularz({ email: 'osoba@przyklad.example', pseudonim: 'Bywalec Testowy', parafia: 'parafia-testowa-alfa' }),
    );
    expect(odpowiedz.status).toBe(200);
    expect(s.email.wyslane).toHaveLength(1);
    expect(s.email.wyslane[0].adres).toBe('osoba@przyklad.example');
    expect(s.email.wyslane[0].tresc).toMatch(/token=/);
  });

  it('kliknięcie linku weryfikuje konto i otwiera sesję', async () => {
    const s = srodowiskoTestowe();
    const cookie = await zarejestrujIZweryfikuj(s, 'osoba@przyklad.example', 'Bywalec Testowy');
    expect(cookie).toMatch(/^sesja=/);
    const formularzGlosu = await s.app.request('/glos/parafia-testowa-alfa', {
      headers: { cookie },
    });
    expect(formularzGlosu.status).toBe(200);
  });

  it('zużyty token nie działa ponownie', async () => {
    const s = srodowiskoTestowe();
    await zarejestrujIZweryfikuj(s, 'osoba@przyklad.example', 'Bywalec Testowy');
    const token = /token=([a-z0-9-]+)/i.exec(s.email.wyslane[0].tresc)?.[1];
    const ponownie = await s.app.request(`/weryfikacja?token=${token}`);
    expect(ponownie.status).toBe(400);
  });
});

describe('przyjmowanie głosu', () => {
  // Głos wolno teraz napisać przed potwierdzeniem adresu (gość podaje
  // e-mail i pseudonim w tym samym formularzu), więc brak sesji nie jest
  // już sam w sobie odmową. Niezmienne zostaje to, co chroniło produkt:
  // głos bez tożsamości autora nie powstaje wcale.
  it('odrzuca głos bez sesji i bez tożsamości w formularzu — nic nie powstaje', async () => {
    const s = srodowiskoTestowe();
    const bezSesji = await zlozGlos(s, 'sesja=nieistniejaca.podpis');
    expect(bezSesji.status).toBe(400);
    expect(await bezSesji.text()).toMatch(/e-mail/i);
    const wiersze = s.baza.prepare('SELECT COUNT(*) AS n FROM glosy').get() as { n: number };
    expect(wiersze.n).toBe(0);
    const konta = s.baza.prepare('SELECT COUNT(*) AS n FROM konta').get() as { n: number };
    expect(konta.n).toBe(0);
  });

  it('podrobione ciasteczko sesji nie czyni z gościa autora', async () => {
    const s = srodowiskoTestowe();
    const zadanie = formularz({
      parafia: 'parafia-testowa-alfa',
      email: 'gosc@przyklad.example',
      pseudonim: 'Gość Testowy',
      ocenaOgolna: '5',
      przyjecie: '5',
      muzyka: '5',
      zDziecmi: '5',
      dostepnosc: '5',
      organizacja: '5',
    });
    const podszycie = await s.app.request('/glos', {
      ...zadanie,
      headers: { ...zadanie.headers, cookie: 'sesja=nieistniejaca.podpis' },
    });
    expect(podszycie.status).toBe(200);
    const konto = s.baza.prepare('SELECT email, zweryfikowane FROM konta').get() as {
      email: string;
      zweryfikowane: number;
    };
    expect(konto.email).toBe('gosc@przyklad.example');
    expect(konto.zweryfikowane).toBe(0);
  });

  it('zapisuje głos trwale w bazie przed odpowiedzią', async () => {
    const s = srodowiskoTestowe();
    const cookie = await zarejestrujIZweryfikuj(s, 'osoba@przyklad.example', 'Bywalec Testowy');
    const odpowiedz = await zlozGlos(s, cookie);
    expect(odpowiedz.status).toBe(200);
    const wiersz = s.baza
      .prepare('SELECT parafia_slug, ocena_ogolna, status FROM glosy')
      .get() as { parafia_slug: string; ocena_ogolna: number; status: string };
    expect(wiersz.parafia_slug).toBe('parafia-testowa-alfa');
    expect(wiersz.ocena_ogolna).toBe(5);
    expect(wiersz.status).toBe('pending');
  });

  it('odrzuca głos z oceną spoza zakresu 1–5', async () => {
    const s = srodowiskoTestowe();
    const cookie = await zarejestrujIZweryfikuj(s, 'osoba@przyklad.example', 'Bywalec Testowy');
    const odpowiedz = await zlozGlos(s, cookie, 'parafia-testowa-alfa', { ocenaOgolna: '6' });
    expect(odpowiedz.status).toBe(400);
    const wiersze = s.baza.prepare('SELECT COUNT(*) AS n FROM glosy').get() as { n: number };
    expect(wiersze.n).toBe(0);
  });

  it('jeden autor ma najwyżej jeden głos na parafię — ponowny zapis nadpisuje', async () => {
    const s = srodowiskoTestowe();
    const cookie = await zarejestrujIZweryfikuj(s, 'osoba@przyklad.example', 'Bywalec Testowy');
    await zlozGlos(s, cookie, 'parafia-testowa-alfa', { ocenaOgolna: '3' });
    await zlozGlos(s, cookie, 'parafia-testowa-alfa', { ocenaOgolna: '5' });
    const wiersze = s.baza
      .prepare('SELECT ocena_ogolna FROM glosy')
      .all() as { ocena_ogolna: number }[];
    expect(wiersze).toHaveLength(1);
    expect(wiersze[0].ocena_ogolna).toBe(5);
  });

  it('formularz głosu pokazuje zasady moderacji językiem opisującym', async () => {
    const s = srodowiskoTestowe();
    const cookie = await zarejestrujIZweryfikuj(s, 'osoba@przyklad.example', 'Bywalec Testowy');
    const strona = await s.app.request('/glos/parafia-testowa-alfa', { headers: { cookie } });
    const html = await strona.text();
    expect(html).toContain('moderacj');
    expect(html).toContain('doświadczeni');
  });
});
