import { createServer } from 'node:http';
import type { IncomingMessage } from 'node:http';
import { utworzAplikacje } from './aplikacja.ts';
import { otworzBaze } from './baza.ts';
import { DostawcaKonsolowy } from './email.ts';

// Uruchomienie deweloperskie: `npm run serwis`. Hosting produkcyjny jest
// nierozstrzygnięty (BRAK w dokumencie 04) — adapter node:http wystarcza
// lokalnie i nie przesądza środowiska docelowego.

const sekretSesji = process.env.SEKRET_SESJI;
if (!sekretSesji) throw new Error('BRAK: zmienna środowiskowa SEKRET_SESJI');

const port = Number(process.env.PORT ?? 8788);
const app = utworzAplikacje({
  baza: otworzBaze(process.env.BAZA_SQLITE ?? 'serwer/dane.db'),
  email: new DostawcaKonsolowy(),
  sekretSesji,
  moderatorzy: (process.env.MODERATORZY ?? '').split(',').map((a) => a.trim()).filter(Boolean),
  katalogEksportu: process.env.KATALOG_GLOSOW ?? 'src/dane/glosy',
  bazowyUrl: process.env.BAZOWY_URL ?? `http://localhost:${port}`,
});

function cialo(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const czesci: Buffer[] = [];
    req.on('data', (czesc: Buffer) => czesci.push(czesc));
    req.on('end', () => resolve(Buffer.concat(czesci)));
    req.on('error', reject);
  });
}

createServer((req, res) => {
  void (async () => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? `localhost:${port}`}`);
    const metoda = req.method ?? 'GET';
    const odpowiedz = await app.fetch(
      new Request(url, {
        method: metoda,
        headers: Object.entries(req.headers).flatMap(([nazwa, wartosc]) =>
          wartosc === undefined
            ? []
            : (Array.isArray(wartosc) ? wartosc : [wartosc]).map((w): [string, string] => [nazwa, w]),
        ),
        body: metoda === 'GET' || metoda === 'HEAD' ? undefined : new Uint8Array(await cialo(req)),
      }),
    );
    for (const [nazwa, wartosc] of odpowiedz.headers) {
      if (nazwa !== 'set-cookie') res.setHeader(nazwa, wartosc);
    }
    const ciasteczka = odpowiedz.headers.getSetCookie();
    if (ciasteczka.length > 0) res.setHeader('set-cookie', ciasteczka);
    res.statusCode = odpowiedz.status;
    res.end(Buffer.from(await odpowiedz.arrayBuffer()));
  })();
}).listen(port, () => {
  console.log(`Serwis zapisu Church: http://localhost:${port}`);
});
