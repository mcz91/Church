import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

// Vitest transformuje TypeScript esbuildem, a produkcja uruchamia serwis
// przez `node --experimental-strip-types`, który potrafi tylko wycinać
// typy. Składnia wymagająca generowania kodu (np. właściwości
// deklarowane w parametrach konstruktora) przechodzi więc w testach,
// a wywala się przy starcie — dokładnie tak padł `npm run serwis`.
// Ten test sprawdza moduły tak, jak ładuje je Node w produkcji.

const korzen = fileURLToPath(new URL('..', import.meta.url));
const uruchom = promisify(execFile);

const MODULY = [
  'serwer/aplikacja.ts',
  'serwer/baza.ts',
  'serwer/eksport.ts',
  'serwer/email.ts',
  'serwer/email-brevo.ts',
  'serwer/obrazy.ts',
  'serwer/moderacja-wstepna.ts',
  'src/lib/mapki.ts',
  'src/lib/msze.ts',
];

describe('moduły ładują się tak, jak w produkcji', () => {
  it.each(MODULY)('%s przechodzi przez --experimental-strip-types', async (modul) => {
    await expect(
      uruchom('node', ['--experimental-strip-types', '--input-type=module', '-e', `import('./${modul}')`], {
        cwd: korzen,
      }),
    ).resolves.toBeDefined();
  });
});
