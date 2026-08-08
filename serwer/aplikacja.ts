import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { Hono } from 'hono';
import type { Context } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { EMAIL, WYMIARY, ZASADY_MODERACJI, glosSchema } from '../src/lib/glosy.ts';
import type { Glos } from '../src/lib/glosy.ts';
import { eksportujGlos, usunPlikiAutora } from './eksport.ts';
import type { DostawcaEmail } from './email.ts';

export type Konfiguracja = {
  baza: DatabaseSync;
  email: DostawcaEmail;
  sekretSesji: string;
  moderatorzy: string[];
  katalogEksportu: string;
  bazowyUrl: string;
};

type Konto = { id: string; email: string; pseudonim: string | null; zweryfikowane: number };

const WAZNOSC_TOKENU_MS = 60 * 60 * 1000;

function ucieknij(tekst: string): string {
  return tekst
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function strona(tytul: string, tresc: string): string {
  return `<!doctype html>
<html lang="pl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${ucieknij(tytul)} — Church, serwis zapisu</title></head>
<body style="max-width:36rem;margin:3rem auto;padding:0 1rem;font-family:system-ui,sans-serif;line-height:1.6">
<h1 style="font-weight:500">${ucieknij(tytul)}</h1>
${tresc}
</body></html>`;
}

function poleOceny(nazwa: string, etykieta: string): string {
  return `<label style="display:block;margin-top:.6rem">${ucieknij(etykieta)}
<select name="${nazwa}" required>
<option value="">—</option>${[1, 2, 3, 4, 5].map((n) => `<option>${n}</option>`).join('')}
</select></label>`;
}

export function utworzAplikacje(k: Konfiguracja): Hono {
  const app = new Hono();
  const moderatorzy = k.moderatorzy.map((adres) => adres.toLowerCase());

  const podpis = (kontoId: string) =>
    createHmac('sha256', k.sekretSesji).update(kontoId).digest('hex');

  function sesja(c: Context): Konto | null {
    const cookie = getCookie(c, 'sesja');
    if (!cookie) return null;
    const [kontoId, otrzymany] = cookie.split('.');
    if (!kontoId || !otrzymany) return null;
    const oczekiwany = Buffer.from(podpis(kontoId));
    const podany = Buffer.from(otrzymany);
    if (podany.length !== oczekiwany.length || !timingSafeEqual(podany, oczekiwany)) return null;
    const konto = k.baza.prepare('SELECT * FROM konta WHERE id = ?').get(kontoId) as
      | Konto
      | undefined;
    return konto ?? null;
  }

  const moderator = (c: Context): Konto | null => {
    const konto = sesja(c);
    return konto && moderatorzy.includes(konto.email.toLowerCase()) ? konto : null;
  };

  app.post('/rejestracja', async (c) => {
    const cialo = await c.req.parseBody();
    const email = String(cialo.email ?? '').trim();
    const pseudonim = String(cialo.pseudonim ?? '').trim();
    const parafia = String(cialo.parafia ?? '').trim();
    if (!EMAIL.test(email)) return c.text('BRAK: poprawny adres e-mail', 400);
    if (!pseudonim || EMAIL.test(pseudonim)) {
      return c.text('BRAK: pseudonim (bez adresu e-mail)', 400);
    }

    let konto = k.baza.prepare('SELECT * FROM konta WHERE email = ?').get(email) as
      | Konto
      | undefined;
    if (konto) {
      k.baza.prepare('UPDATE konta SET pseudonim = ? WHERE id = ?').run(pseudonim, konto.id);
    } else {
      konto = { id: randomUUID(), email, pseudonim, zweryfikowane: 0 };
      k.baza
        .prepare('INSERT INTO konta (id, email, pseudonim, zweryfikowane) VALUES (?, ?, ?, 0)')
        .run(konto.id, email, pseudonim);
    }

    const token = randomUUID();
    k.baza
      .prepare('INSERT INTO tokeny (token, konto_id, parafia_slug, wygasa) VALUES (?, ?, ?, ?)')
      .run(token, konto.id, parafia || null, Date.now() + WAZNOSC_TOKENU_MS);
    await k.email.wyslij(
      email,
      'Twój link do głosu — Church',
      `Dokończ w jednym kliknięciu: ${k.bazowyUrl}/weryfikacja?token=${token}\n` +
        'Link działa godzinę i tylko raz. Jeśli to nie Ty — zignoruj tę wiadomość.',
    );
    return c.html(
      strona('Sprawdź skrzynkę', '<p>Wysłaliśmy link — kliknięcie potwierdza adres i otwiera formularz głosu.</p>'),
    );
  });

  app.get('/weryfikacja', (c) => {
    const token = c.req.query('token') ?? '';
    const wiersz = k.baza
      .prepare('SELECT konto_id, parafia_slug, wygasa FROM tokeny WHERE token = ?')
      .get(token) as { konto_id: string; parafia_slug: string | null; wygasa: number } | undefined;
    k.baza.prepare('DELETE FROM tokeny WHERE token = ?').run(token);
    if (!wiersz || wiersz.wygasa < Date.now()) {
      return c.text('Link wygasł albo był już użyty — poproś o nowy.', 400);
    }
    k.baza.prepare('UPDATE konta SET zweryfikowane = 1 WHERE id = ?').run(wiersz.konto_id);
    setCookie(c, 'sesja', `${wiersz.konto_id}.${podpis(wiersz.konto_id)}`, {
      httpOnly: true,
      sameSite: 'Lax',
      path: '/',
    });
    return c.redirect(wiersz.parafia_slug ? `/glos/${wiersz.parafia_slug}` : '/glos');
  });

  app.get('/glos/:parafia', (c) => {
    const konto = sesja(c);
    if (!konto || !konto.zweryfikowane) {
      return c.text('Najpierw potwierdź adres e-mail linkiem z wiadomości.', 401);
    }
    const parafia = c.req.param('parafia');
    return c.html(
      strona(
        'Twój głos',
        `<form method="post" action="/glos">
<input type="hidden" name="parafia" value="${ucieknij(parafia)}">
${poleOceny('ocenaOgolna', 'Ocena ogólna (1–5)')}
${Object.entries(WYMIARY)
  .map(([nazwa, etykieta]) => poleOceny(nazwa, `${etykieta} (1–5)`))
  .join('\n')}
<label style="display:block;margin-top:.6rem">Twoje doświadczenie (opcjonalnie)
<textarea name="tekst" rows="5" style="width:100%"></textarea></label>
<button style="margin-top:1rem">Wyślij do moderacji</button>
</form>
<p><small>${ZASADY_MODERACJI}</small></p>`,
      ),
    );
  });

  app.post('/glos', async (c) => {
    const konto = sesja(c);
    if (!konto || !konto.zweryfikowane || !konto.pseudonim) {
      return c.text('Głos przyjmujemy wyłącznie od zweryfikowanego konta z pseudonimem.', 401);
    }
    const cialo = await c.req.parseBody();
    const liczba = (pole: string) => Number(cialo[pole]);
    const tekst = String(cialo.tekst ?? '').trim();
    const kandydat = {
      parafiaSlug: String(cialo.parafia ?? ''),
      autor: { pseudonim: konto.pseudonim, konto: konto.id },
      status: 'pending',
      ocenaOgolna: liczba('ocenaOgolna'),
      wymiary: {
        przyjecie: liczba('przyjecie'),
        muzyka: liczba('muzyka'),
        zDziecmi: liczba('zDziecmi'),
        dostepnosc: liczba('dostepnosc'),
        organizacja: liczba('organizacja'),
      },
      ...(tekst ? { tekst } : {}),
      data: new Date().toISOString().slice(0, 10),
    };
    const wynik = glosSchema.safeParse(kandydat);
    if (!wynik.success) return c.text('Głos nie przechodzi walidacji — popraw pola.', 400);
    const glos = wynik.data;

    // Trwały zapis przed odpowiedzią; ponowny zapis nadpisuje własny głos.
    k.baza
      .prepare(
        `INSERT INTO glosy (id, konto_id, parafia_slug, ocena_ogolna, przyjecie, muzyka,
           z_dziecmi, dostepnosc, organizacja, tekst, status, powod_odrzucenia, data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, ?)
         ON CONFLICT (konto_id, parafia_slug) DO UPDATE SET
           ocena_ogolna = excluded.ocena_ogolna, przyjecie = excluded.przyjecie,
           muzyka = excluded.muzyka, z_dziecmi = excluded.z_dziecmi,
           dostepnosc = excluded.dostepnosc, organizacja = excluded.organizacja,
           tekst = excluded.tekst, status = 'pending', powod_odrzucenia = NULL,
           data = excluded.data`,
      )
      .run(
        randomUUID(),
        konto.id,
        glos.parafiaSlug,
        glos.ocenaOgolna,
        glos.wymiary.przyjecie,
        glos.wymiary.muzyka,
        glos.wymiary.zDziecmi,
        glos.wymiary.dostepnosc,
        glos.wymiary.organizacja,
        glos.tekst ?? null,
        glos.data,
      );
    return c.html(
      strona('Dziękujemy', '<p>Głos czeka na moderację — po przyjęciu pojawi się na stronie parafii.</p>'),
    );
  });

  app.get('/moderacja', (c) => {
    if (!sesja(c)) return c.text('Zaloguj się magic linkiem.', 401);
    if (!moderator(c)) return c.text('Panel wyłącznie dla operatora.', 403);
    const oczekujace = k.baza
      .prepare(`SELECT g.*, k2.pseudonim FROM glosy g JOIN konta k2 ON k2.id = g.konto_id
                WHERE g.status = 'pending' ORDER BY g.rowid`)
      .all() as (Record<string, string | number | null> & { id: string })[];
    const lista = oczekujace
      .map(
        (g) => `<li><b>${ucieknij(String(g.pseudonim))}</b> o ${ucieknij(String(g.parafia_slug))}
· ogólna ${String(g.ocena_ogolna)}<br>${ucieknij(String(g.tekst ?? '(bez tekstu)'))}
<form method="post" action="/moderacja/przyjmij" style="display:inline">
<input type="hidden" name="id" value="${ucieknij(g.id)}"><button>przyjmij</button></form>
<form method="post" action="/moderacja/odrzuc" style="display:inline">
<input type="hidden" name="id" value="${ucieknij(g.id)}">
<input name="powod" placeholder="powód odrzucenia" required><button>odrzuć</button></form></li>`,
      )
      .join('\n');
    return c.html(
      strona('Moderacja', `<p>${ZASADY_MODERACJI}</p><ul>${lista || '<li>nic nie czeka</li>'}</ul>`),
    );
  });

  app.post('/moderacja/przyjmij', async (c) => {
    if (!moderator(c)) return c.text('Panel wyłącznie dla operatora.', sesja(c) ? 403 : 401);
    const cialo = await c.req.parseBody();
    const id = String(cialo.id ?? '');
    const wiersz = k.baza
      .prepare(`SELECT g.*, k2.pseudonim FROM glosy g JOIN konta k2 ON k2.id = g.konto_id
                WHERE g.id = ?`)
      .get(id) as Record<string, string | number | null> | undefined;
    if (!wiersz) return c.text('Nie ma takiego głosu.', 404);
    const glos: Glos = {
      parafiaSlug: String(wiersz.parafia_slug),
      autor: { pseudonim: String(wiersz.pseudonim), konto: String(wiersz.konto_id) },
      status: 'approved',
      ocenaOgolna: Number(wiersz.ocena_ogolna),
      wymiary: {
        przyjecie: Number(wiersz.przyjecie),
        muzyka: Number(wiersz.muzyka),
        zDziecmi: Number(wiersz.z_dziecmi),
        dostepnosc: Number(wiersz.dostepnosc),
        organizacja: Number(wiersz.organizacja),
      },
      ...(wiersz.tekst ? { tekst: String(wiersz.tekst) } : {}),
      data: String(wiersz.data),
    };
    const plik = eksportujGlos(k.katalogEksportu, glos);
    k.baza.prepare(`UPDATE glosy SET status = 'approved', powod_odrzucenia = NULL WHERE id = ?`).run(id);
    return c.text(`Przyjęty i wyeksportowany: ${plik}`);
  });

  app.post('/moderacja/odrzuc', async (c) => {
    if (!moderator(c)) return c.text('Panel wyłącznie dla operatora.', sesja(c) ? 403 : 401);
    const cialo = await c.req.parseBody();
    const id = String(cialo.id ?? '');
    const powod = String(cialo.powod ?? '').trim();
    if (!powod) return c.text('BRAK: powód odrzucenia.', 400);
    const wynik = k.baza
      .prepare(`UPDATE glosy SET status = 'rejected', powod_odrzucenia = ? WHERE id = ?`)
      .run(powod, id);
    if (wynik.changes === 0) return c.text('Nie ma takiego głosu.', 404);
    return c.text('Odrzucony z powodem — nic nie zostało opublikowane.');
  });

  app.post('/konto/usun', (c) => {
    const konto = sesja(c);
    if (!konto) return c.text('Zaloguj się magic linkiem.', 401);
    const pliki = usunPlikiAutora(k.katalogEksportu, konto.id);
    k.baza.prepare('DELETE FROM konta WHERE id = ?').run(konto.id);
    return c.text(
      `Konto i głosy usunięte z bazy. Pliki do zdjęcia z repozytorium:\n${pliki.join('\n') || '(żadnych)'}`,
    );
  });

  return app;
}
