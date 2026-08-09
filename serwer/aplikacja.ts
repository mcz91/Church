import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { Hono } from 'hono';
import type { Context } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { EMAIL, WYMIARY, ZASADY_MODERACJI, glosSchema } from '../src/lib/glosy.ts';
import type { Glos } from '../src/lib/glosy.ts';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { eksportujGlos, usunPlikiAutora } from './eksport.ts';
import { LIMIT_BAJTOW, oczyscObraz } from './obrazy.ts';
import type { DostawcaEmail } from './email.ts';
import { klasyfikujGlos } from './moderacja-wstepna.ts';

export type Konfiguracja = {
  baza: DatabaseSync;
  email: DostawcaEmail;
  sekretSesji: string;
  moderatorzy: string[];
  katalogEksportu: string;
  katalogMagazynu: string;
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
  mkdirSync(k.katalogMagazynu, { recursive: true });

  const zdjeciaGlosu = (glosId: string) =>
    k.baza.prepare('SELECT * FROM zdjecia WHERE glos_id = ? ORDER BY plik').all(glosId) as {
      id: string;
      glos_id: string;
      plik: string;
      alt: string;
      podpis: string | null;
    }[];

  // Jedyna droga zdjęcia do katalogu publikowanego wiedzie przez approve;
  // każda inna ścieżka może zdjęcia wyłącznie usuwać.
  const usunZdjeciaGlosu = (glosId: string) => {
    for (const zdjecie of zdjeciaGlosu(glosId)) {
      rmSync(join(k.katalogMagazynu, zdjecie.plik), { force: true });
    }
    k.baza.prepare('DELETE FROM zdjecia WHERE glos_id = ?').run(glosId);
  };
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
        `<form method="post" action="/glos" enctype="multipart/form-data">
<input type="hidden" name="parafia" value="${ucieknij(parafia)}">
${poleOceny('ocenaOgolna', 'Ocena ogólna (1–5)')}
${Object.entries(WYMIARY)
  .map(([nazwa, etykieta]) => poleOceny(nazwa, `${etykieta} (1–5)`))
  .join('\n')}
<label style="display:block;margin-top:.6rem">Twoje doświadczenie (opcjonalnie)
<textarea name="tekst" rows="5" style="width:100%"></textarea></label>
<fieldset style="margin-top:1rem;border:1px solid #ccc;padding:.6rem">
<legend>Zdjęcia miejsca (opcjonalnie, JPEG/PNG do 8 MB)</legend>
<p><small>Zdjęcia pokazują miejsce, nie ludzi — fotografie z rozpoznawalnymi
osobami odpadają w moderacji. Metadane (EXIF, geolokalizacja, dane
urządzenia) usuwamy przy przyjęciu.</small></p>
${[1, 2, 3]
  .map(
    (n) => `<label style="display:block;margin-top:.6rem">Zdjęcie ${n}
<input type="file" name="zdjecie${n}" accept="image/jpeg,image/png"></label>
<label style="display:block">Co przedstawia (tekst alternatywny — wymagany przy zdjęciu)
<input type="text" name="zdjecieAlt${n}" style="width:100%"></label>
<label style="display:block">Podpis (opcjonalnie)
<input type="text" name="zdjeciePodpis${n}" style="width:100%"></label>`,
  )
  .join('')}
</fieldset>
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

    // Zdjęcia: walidacja w całości przed jakimkolwiek zapisem; metadane
    // (EXIF, geolokalizacja) usuwane przed zapisem do magazynu.
    const obrazy: { dane: Buffer; rozszerzenie: string; alt: string; podpis: string | null }[] = [];
    for (const n of [1, 2, 3]) {
      const plik = cialo[`zdjecie${n}`];
      if (!(plik instanceof File) || plik.size === 0) continue;
      if (plik.size > LIMIT_BAJTOW) {
        return c.text(`Zdjęcie ${n} przekracza limit 8 MB — odrzucone.`, 400);
      }
      const alt = String(cialo[`zdjecieAlt${n}`] ?? '').trim();
      if (!alt) {
        return c.text(`Zdjęcie ${n} wymaga tekstu alternatywnego opisującego miejsce.`, 400);
      }
      const podpis = String(cialo[`zdjeciePodpis${n}`] ?? '').trim() || null;
      if (EMAIL.test(alt) || (podpis && EMAIL.test(podpis))) {
        return c.text('Opisy zdjęć nie mogą zawierać adresu e-mail.', 400);
      }
      const oczyszczony = oczyscObraz(Buffer.from(await plik.arrayBuffer()));
      if (!oczyszczony) {
        return c.text(`Zdjęcie ${n}: przyjmujemy wyłącznie JPEG lub PNG w rozsądnych wymiarach.`, 400);
      }
      obrazy.push({
        dane: oczyszczony.dane,
        rozszerzenie: oczyszczony.format === 'jpeg' ? 'jpg' : 'png',
        alt,
        podpis,
      });
    }

    // Wstępna moderacja regułowa: twarde przypadki automat odrzuca
    // z powodem i flagą odwołania; approved ustawia wyłącznie człowiek.
    const klasyfikacja = klasyfikujGlos({ tekst: glos.tekst, pseudonim: konto.pseudonim });
    const autoOdrzucony = klasyfikacja.twarde.length > 0;
    const powod = autoOdrzucony
      ? klasyfikacja.twarde.map((t) => t.powod).join('; ')
      : null;
    const podpowiedz = klasyfikacja.podpowiedzi.length > 0 ? klasyfikacja.podpowiedzi.join('; ') : null;

    // Trwały zapis przed odpowiedzią; ponowny zapis nadpisuje własny głos.
    k.baza
      .prepare(
        `INSERT INTO glosy (id, konto_id, parafia_slug, ocena_ogolna, przyjecie, muzyka,
           z_dziecmi, dostepnosc, organizacja, tekst, status, powod_odrzucenia,
           auto_odrzucone, podpowiedz, data, utworzone)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (konto_id, parafia_slug) DO UPDATE SET
           ocena_ogolna = excluded.ocena_ogolna, przyjecie = excluded.przyjecie,
           muzyka = excluded.muzyka, z_dziecmi = excluded.z_dziecmi,
           dostepnosc = excluded.dostepnosc, organizacja = excluded.organizacja,
           tekst = excluded.tekst, status = excluded.status,
           powod_odrzucenia = excluded.powod_odrzucenia,
           auto_odrzucone = excluded.auto_odrzucone,
           podpowiedz = excluded.podpowiedz,
           data = excluded.data, utworzone = excluded.utworzone`,
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
        autoOdrzucony ? 'rejected' : 'pending',
        powod,
        autoOdrzucony ? 1 : 0,
        podpowiedz,
        glos.data,
        Date.now(),
      );
    const { id: idGlosu } = k.baza
      .prepare('SELECT id FROM glosy WHERE konto_id = ? AND parafia_slug = ?')
      .get(konto.id, glos.parafiaSlug) as { id: string };
    // Ponowny zapis nadpisuje także zdjęcia; pliki w magazynie noszą
    // wyłącznie identyfikator głosu, nigdy oryginalną nazwę.
    usunZdjeciaGlosu(idGlosu);
    obrazy.forEach((obraz, i) => {
      const nazwa = `${idGlosu}-${i + 1}.${obraz.rozszerzenie}`;
      writeFileSync(join(k.katalogMagazynu, nazwa), obraz.dane);
      k.baza
        .prepare('INSERT INTO zdjecia (id, glos_id, plik, alt, podpis) VALUES (?, ?, ?, ?, ?)')
        .run(randomUUID(), idGlosu, nazwa, obraz.alt, obraz.podpis);
    });
    if (autoOdrzucony) {
      return c.html(
        strona(
          'Głos odrzucony automatycznie',
          `<p>Powód: ${ucieknij(powod ?? '')}.</p>
<p>Jeśli to pomyłka, możesz się odwołać: użyj formularza „zgłoś błąd"
na stronie parafii — odwołanie trafi do moderatora-człowieka.</p>`,
        ),
      );
    }
    return c.html(
      strona('Dziękujemy', '<p>Głos czeka na moderację — po przyjęciu pojawi się na stronie parafii.</p>'),
    );
  });

  app.get('/blad/:miasto/:slug', (c) => {
    const miasto = c.req.param('miasto');
    const slug = c.req.param('slug');
    if (!/^[a-z0-9-]+$/.test(miasto) || !/^[a-z0-9-]+$/.test(slug)) return c.notFound();
    const karta = `/parafia/${miasto}/${slug}`;
    return c.html(
      strona(
        'Zgłoś błąd w faktach',
        `<p>Karta: <code>${ucieknij(karta)}</code></p>
<p>Błąd godzin mszy to realna szkoda — poprawka faktu ma pierwszeństwo.
Napisz, co się nie zgadza (i skąd wiesz, jeśli możesz podać źródło).</p>
<form method="post" action="/blad">
<input type="hidden" name="karta" value="${ucieknij(karta)}">
<label>Co jest błędne?
<textarea name="tresc" rows="5" style="width:100%" required></textarea></label>
<button style="margin-top:1rem">Wyślij zgłoszenie</button>
</form>`,
      ),
    );
  });

  app.post('/blad', async (c) => {
    const cialo = await c.req.parseBody();
    const karta = String(cialo.karta ?? '').trim();
    const tresc = String(cialo.tresc ?? '').trim();
    if (!karta || !tresc) return c.text('BRAK: adres karty i treść zgłoszenia.', 400);
    // Trwały zapis przed odpowiedzią.
    k.baza
      .prepare(`INSERT INTO zgloszenia (id, karta, tresc, status, utworzone) VALUES (?, ?, ?, 'otwarte', ?)`)
      .run(randomUUID(), karta, tresc, Date.now());
    return c.html(
      strona('Dziękujemy', '<p>Zgłoszenie trafiło do kolejki moderacji — poprawka faktu ma pierwszeństwo.</p>'),
    );
  });

  app.get('/moderacja', (c) => {
    if (!sesja(c)) return c.text('Zaloguj się magic linkiem.', 401);
    if (!moderator(c)) return c.text('Panel wyłącznie dla operatora.', 403);
    const glosy = k.baza
      .prepare(`SELECT g.*, k2.pseudonim FROM glosy g JOIN konta k2 ON k2.id = g.konto_id
                WHERE g.status = 'pending' OR g.auto_odrzucone = 1 ORDER BY g.utworzone`)
      .all() as (Record<string, string | number | null> & { id: string })[];
    const zgloszenia = k.baza
      .prepare(`SELECT * FROM zgloszenia WHERE status = 'otwarte' ORDER BY utworzone`)
      .all() as (Record<string, string | number> & { id: string })[];

    // Rozmiar kolejki i wiek najstarszej pozycji — limit operatora
    // 3 h/tydzień ma być mierzalny, nie deklarowany.
    const oczekujace = glosy.filter((g) => g.status === 'pending');
    const rozmiar = oczekujace.length + zgloszenia.length;
    const najstarsze = Math.min(
      ...oczekujace.map((g) => Number(g.utworzone)),
      ...zgloszenia.map((z) => Number(z.utworzone)),
    );
    const wiekGodziny = Number.isFinite(najstarsze)
      ? Math.round((Date.now() - najstarsze) / 3_600_000)
      : null;
    const naglowekKolejki =
      rozmiar === 0
        ? '<p><b>Kolejka: pusta.</b></p>'
        : `<p><b>Kolejka: ${rozmiar}</b> (głosy: ${oczekujace.length}, zgłoszenia błędów: ${zgloszenia.length}) · najstarsza pozycja czeka ${
            wiekGodziny !== null && wiekGodziny < 1 ? 'mniej niż godzinę' : `ok. ${wiekGodziny} h`
          }</p>`;

    const pozycjaGlosu = (g: (typeof glosy)[number]) => `<li><b>${ucieknij(String(g.pseudonim))}</b>
o ${ucieknij(String(g.parafia_slug))} · ogólna ${String(g.ocena_ogolna)}<br>
${ucieknij(String(g.tekst ?? '(bez tekstu)'))}
${g.podpowiedz ? `<br><em>podpowiedź automatu: ${ucieknij(String(g.podpowiedz))}</em>` : ''}
${g.auto_odrzucone ? `<br><em>odrzucony automatycznie (${ucieknij(String(g.powod_odrzucenia))}) — odwołanie możliwe</em>` : ''}
${zdjeciaGlosu(g.id)
  .map(
    (z) => `<br><img src="/moderacja/zdjecie/${ucieknij(z.plik)}" alt="${ucieknij(z.alt)}" style="max-width:220px">
<br><small>podpis: ${ucieknij(z.podpis ?? '(bez podpisu)')} · zasada: miejsce, nie ludzie — rozpoznawalne osoby: odrzucenie</small>
<form method="post" action="/moderacja/odrzuc-zdjecia" style="display:inline">
<input type="hidden" name="id" value="${ucieknij(g.id)}">
<input name="powod" placeholder="powód odrzucenia zdjęć" required><button>odrzuć same zdjęcia</button></form>`,
  )
  .join('')}
<form method="post" action="/moderacja/przyjmij" style="display:inline">
<input type="hidden" name="id" value="${ucieknij(g.id)}"><button>przyjmij</button></form>
<form method="post" action="/moderacja/odrzuc" style="display:inline">
<input type="hidden" name="id" value="${ucieknij(g.id)}">
<input name="powod" placeholder="powód odrzucenia" required><button>odrzuć</button></form></li>`;

    const listaGlosow = oczekujace.map(pozycjaGlosu).join('\n');
    const listaOdwolan = glosy.filter((g) => g.status === 'rejected' && g.auto_odrzucone).map(pozycjaGlosu).join('\n');
    const listaZgloszen = zgloszenia
      .map(
        (z) => `<li><code>${ucieknij(String(z.karta))}</code><br>${ucieknij(String(z.tresc))}
<form method="post" action="/moderacja/zgloszenie-zamknij" style="display:inline">
<input type="hidden" name="id" value="${ucieknij(z.id)}"><button>zamknij</button></form></li>`,
      )
      .join('\n');

    return c.html(
      strona(
        'Moderacja',
        `${naglowekKolejki}
<p>${ZASADY_MODERACJI}</p>
<h2>Głosy oczekujące</h2><ul>${listaGlosow || '<li>nic nie czeka</li>'}</ul>
<h2>Odrzucone automatem (odwołania możliwe)</h2><ul>${listaOdwolan || '<li>żadnych</li>'}</ul>
<h2>Zgłoszenia błędów faktów</h2><ul>${listaZgloszen || '<li>żadnych</li>'}</ul>`,
      ),
    );
  });

  app.post('/moderacja/odrzuc-zdjecia', async (c) => {
    if (!moderator(c)) return c.text('Panel wyłącznie dla operatora.', sesja(c) ? 403 : 401);
    const cialo = await c.req.parseBody();
    const id = String(cialo.id ?? '');
    const powod = String(cialo.powod ?? '').trim();
    if (!powod) return c.text('BRAK: powód odrzucenia zdjęć.', 400);
    const istnieje = k.baza.prepare('SELECT id FROM glosy WHERE id = ?').get(id);
    if (!istnieje) return c.text('Nie ma takiego głosu.', 404);
    usunZdjeciaGlosu(id);
    return c.text('Zdjęcia odrzucone i usunięte z magazynu — głos pozostaje w kolejce bez zdjęć.');
  });

  app.get('/moderacja/zdjecie/:plik', (c) => {
    if (!moderator(c)) return c.text('Panel wyłącznie dla operatora.', sesja(c) ? 403 : 401);
    const plik = c.req.param('plik');
    if (!/^[a-z0-9-]+-\d+\.(jpg|png)$/.test(plik)) return c.notFound();
    try {
      const dane = readFileSync(join(k.katalogMagazynu, plik));
      return c.body(new Uint8Array(dane), 200, {
        'content-type': plik.endsWith('.png') ? 'image/png' : 'image/jpeg',
      });
    } catch {
      return c.notFound();
    }
  });

  app.post('/moderacja/zgloszenie-zamknij', async (c) => {
    if (!moderator(c)) return c.text('Panel wyłącznie dla operatora.', sesja(c) ? 403 : 401);
    const cialo = await c.req.parseBody();
    const wynik = k.baza
      .prepare(`UPDATE zgloszenia SET status = 'zamkniete' WHERE id = ?`)
      .run(String(cialo.id ?? ''));
    if (wynik.changes === 0) return c.text('Nie ma takiego zgłoszenia.', 404);
    return c.text('Zgłoszenie zamknięte.');
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
    // Nazwy publikowanych plików pochodzą od identyfikatora konta (jak
    // plik głosu), nigdy od nazwy oryginalnej.
    const obrazyGlosu = zdjeciaGlosu(id);
    const zdjecia = obrazyGlosu.map((zdjecie, i) => ({
      plik: `${String(wiersz.konto_id)}-${i + 1}.${zdjecie.plik.endsWith('.png') ? 'png' : 'jpg'}`,
      alt: zdjecie.alt,
      ...(zdjecie.podpis ? { podpis: zdjecie.podpis } : {}),
    }));
    if (zdjecia.length > 0) glos.zdjecia = zdjecia;
    const plik = eksportujGlos(
      k.katalogEksportu,
      glos,
      obrazyGlosu.map((zdjecie, i) => ({
        zrodlo: join(k.katalogMagazynu, zdjecie.plik),
        plik: zdjecia[i].plik,
      })),
    );
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
    usunZdjeciaGlosu(id);
    return c.text('Odrzucony z powodem — nic nie zostało opublikowane, zdjęcia usunięte z magazynu.');
  });

  app.post('/konto/usun', (c) => {
    const konto = sesja(c);
    if (!konto) return c.text('Zaloguj się magic linkiem.', 401);
    const glosyKonta = k.baza.prepare('SELECT id FROM glosy WHERE konto_id = ?').all(konto.id) as {
      id: string;
    }[];
    for (const wiersz of glosyKonta) usunZdjeciaGlosu(wiersz.id);
    const pliki = usunPlikiAutora(k.katalogEksportu, konto.id);
    k.baza.prepare('DELETE FROM konta WHERE id = ?').run(konto.id);
    return c.text(
      `Konto i głosy usunięte z bazy. Pliki do zdjęcia z repozytorium:\n${pliki.join('\n') || '(żadnych)'}`,
    );
  });

  return app;
}
