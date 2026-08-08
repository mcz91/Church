// @ts-check
import process from 'node:process';
import { defineConfig } from 'astro/config';

// Bez `site`: domena nierozstrzygnięta (BRAK w docs/01) — decyzja operatora.
// BUILD_OUT_DIR pozwala testowi integracyjnemu budować do katalogu
// tymczasowego, nie nadpisując dist/.
export default defineConfig({
  output: 'static',
  outDir: process.env.BUILD_OUT_DIR ?? './dist',
});
