import type { DostawcaEmail } from './email.ts';

// Produkcyjny dostawca magic linków (BRAK z dokumentu 04 rozstrzygnięty
// aktem operatora: konfiguracja darmowa, Brevo). Klucz API wyłącznie ze
// zmiennych środowiskowych; fetch wstrzykiwany, więc testy nie dotykają
// sieci. Plan wyjścia: wymiana klasy za interfejsem DostawcaEmail.
export class DostawcaBrevo implements DostawcaEmail {
  // Pola przypisywane jawnie, nie przez właściwości w parametrach:
  // `node --experimental-strip-types` typy wyłącznie wycina i nie
  // wygeneruje przypisań za nas, a to on uruchamia serwis w produkcji.
  readonly #klucz: string;
  readonly #nadawca: string;
  readonly #fetchFn: typeof fetch;

  constructor(klucz: string, nadawca: string, fetchFn: typeof fetch = fetch) {
    this.#klucz = klucz;
    this.#nadawca = nadawca;
    this.#fetchFn = fetchFn;
  }

  async wyslij(adres: string, temat: string, tresc: string): Promise<void> {
    const odpowiedz = await this.#fetchFn('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': this.#klucz, 'content-type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Church', email: this.#nadawca },
        to: [{ email: adres }],
        subject: temat,
        textContent: tresc,
      }),
    });
    if (!odpowiedz.ok) {
      throw new Error(`Brevo: ${odpowiedz.status} ${await odpowiedz.text()}`);
    }
  }
}
