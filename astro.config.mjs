// @ts-check
import { writeFileSync } from 'node:fs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

// Bez `site`: domena nierozstrzygnięta (BRAK w docs/01) — decyzja operatora.
// BUILD_OUT_DIR pozwala testowi integracyjnemu budować do katalogu
// tymczasowego, nie nadpisując dist/.
const bazowy = (process.env.SITE_URL ?? '').replace(/\/+$/, '');

// Sitemap i robots powstają wyłącznie przy ustawionym SITE_URL, bo bez
// adresu absolutnego byłyby zmyślone. Własna integracja zamiast paczki:
// hook `astro:build:done` daje gotową listę stron, a kontrakt zakazuje
// nowych zależności.
const adresyStron = {
  name: 'church-adresy-stron',
  hooks: {
    'astro:build:done': ({ pages, dir }) => {
      if (!bazowy) return;
      const katalog = fileURLToPath(dir);
      const adresy = pages
        .map(({ pathname }) => `${bazowy}${`/${pathname}`.replace(/\/+$/, '') || '/'}`)
        .sort();
      writeFileSync(
        `${katalog}sitemap.xml`,
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
          adresyStron.escapuj(adresy) +
          `</urlset>\n`,
      );
      writeFileSync(
        `${katalog}robots.txt`,
        `User-agent: *\nAllow: /\nSitemap: ${bazowy}/sitemap.xml\n`,
      );
    },
  },
  escapuj: (adresy) =>
    adresy
      .map((adres) => `  <url><loc>${adres.replaceAll('&', '&amp;')}</loc></url>\n`)
      .join(''),
};

export default defineConfig({
  output: 'static',
  outDir: process.env.BUILD_OUT_DIR ?? './dist',
  integrations: [adresyStron],
});
