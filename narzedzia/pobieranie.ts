import { execFileSync } from 'node:child_process';

// Pobieranie z żywych katalogów wyłącznie przy generowaniu danych —
// z uczciwym User-Agentem i odstępami; testy nigdy nie dotykają sieci.
export const USER_AGENT =
  'ChurchBot/0.1 (kontakt: macczeka@gmail.com; pozyskiwanie faktów o parafiach ze źródeł publicznych)';

export function pobierz(url: string, maxCzasS = 20): string {
  return execFileSync('curl', ['-sS', '-L', '--max-time', String(maxCzasS), '-A', USER_AGENT, url], {
    encoding: 'utf-8',
    maxBuffer: 16 * 1024 * 1024,
  });
}

export function odczekaj(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
