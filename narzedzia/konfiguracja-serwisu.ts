import { randomBytes } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

// Jednorazowa konfiguracja serwisu zapisu: generuje `serwer/.env`
// z losowym sekretem sesji, żeby nikt nie musiał wymyślać go ręcznie
// ani wklejać z czatu. Plik jest w .gitignore — sekret nigdy nie wchodzi
// do repozytorium. Istniejącego pliku nie nadpisujemy: to skasowałoby
// działający sekret i wylogowało wszystkich.

const korzen = fileURLToPath(new URL('..', import.meta.url));
const plik = join(korzen, 'serwer/.env');

if (existsSync(plik)) {
  console.log('serwer/.env już istnieje — nie ruszam go.');
  console.log('Aby wygenerować nowy sekret, usuń ten plik i uruchom komendę ponownie.');
  process.exit(0);
}

const moderator = process.argv[2];
if (!moderator || !moderator.includes('@')) {
  console.error('Podaj swój adres e-mail (to on będzie moderatorem):');
  console.error('  npm run serwis:konfiguracja -- twoj@adres.pl');
  process.exit(1);
}

writeFileSync(
  plik,
  `# Wygenerowane przez: npm run serwis:konfiguracja
# Ten plik jest w .gitignore i nigdy nie trafia do repozytorium.
SEKRET_SESJI=${randomBytes(32).toString('hex')}
MODERATORZY=${moderator}
BAZOWY_URL=http://localhost:8788
PORT=8788
# Puste = magic linki lądują na konsoli serwisu (tryb deweloperski).
# Po założeniu konta Brevo wpisz klucz i adres nadawcy:
BREVO_API_KEY=
NADAWCA_EMAIL=
`,
);

console.log('Gotowe: serwer/.env');
console.log(`Moderator: ${moderator}`);
console.log('Teraz uruchom serwis: npm run serwis');
