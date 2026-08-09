import { describe, expect, it } from 'vitest';
import { DostawcaBrevo } from '../serwer/email-brevo.ts';

// Dostawca produkcyjny magic linków (rozstrzygnięcie BRAK z docs/04
// aktem operatora): Brevo przez HTTP API, klucz wyłącznie ze środowiska,
// fetch wstrzykiwany — testy nigdy nie dotykają sieci.

describe('dostawca e-mail Brevo', () => {
  it('wysyła wiadomość przez API z kluczem w nagłówku i nadawcą z konfiguracji', async () => {
    const zadania: { url: string; naglowki: Record<string, string>; cialo: string }[] = [];
    const dostawca = new DostawcaBrevo('klucz-testowy', 'nadawca@przyklad.example', (async (
      url: string | URL | Request,
      init?: RequestInit,
    ) => {
      zadania.push({
        url: String(url),
        naglowki: (init?.headers ?? {}) as Record<string, string>,
        cialo: String(init?.body),
      });
      return new Response('{}', { status: 201 });
    }) as typeof fetch);

    await dostawca.wyslij('osoba@przyklad.example', 'Testowy temat', 'Testowa treść z linkiem');
    expect(zadania).toHaveLength(1);
    expect(zadania[0].url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(zadania[0].naglowki['api-key']).toBe('klucz-testowy');
    const cialo = JSON.parse(zadania[0].cialo) as {
      sender: { email: string };
      to: { email: string }[];
      subject: string;
      textContent: string;
    };
    expect(cialo.sender.email).toBe('nadawca@przyklad.example');
    expect(cialo.to).toEqual([{ email: 'osoba@przyklad.example' }]);
    expect(cialo.textContent).toContain('Testowa treść');
  });

  it('błąd API zgłasza wyjątkiem zamiast udawać wysyłkę', async () => {
    const dostawca = new DostawcaBrevo('klucz-testowy', 'nadawca@przyklad.example', (async () =>
      new Response('limit', { status: 429 })) as typeof fetch);
    await expect(dostawca.wyslij('osoba@przyklad.example', 't', 't')).rejects.toThrow(/429/);
  });
});
