// Mapka na karcie parafii (żądanie operatora 2026-08-10). Położenie
// pochodzi z OpenStreetMap przez Nominatim (ODbL) i jest faktem ze
// źródłem jak każdy inny. Kafelki lądują w repo, więc w runtime nie ma
// ani jednego zasobu z obcej domeny — doktryna zero-CDN bez wyjątku.

export type Polozenie = { szerokosc: number; dlugosc: number };

// Nominatim gubi adres z przedrostkiem „ul."/„al." — zdejmujemy go,
// resztę zostawiamy dokładnie tak, jak stoi w rekordzie.
export function zapytanieOPolozenie(adres: string): string {
  return adres.replace(/^\s*(ul\.|al\.|pl\.|os\.)\s*/i, '').trim();
}

type Trafienie = { lat: string; lon: string; category?: string; type?: string };

// Granice Polski z zapasem — trafienie spoza nich znaczy, że
// wyszukiwarka poszła w świat, a nie że parafia się przeniosła.
const POLSKA = { minLat: 49, maxLat: 55, minLon: 14, maxLon: 24.2 };

export function wybierzTrafienie(trafienia: Trafienie[]): Polozenie | null {
  for (const trafienie of trafienia) {
    if (trafienie.type !== 'place_of_worship') continue;
    const szerokosc = Number(trafienie.lat);
    const dlugosc = Number(trafienie.lon);
    if (!Number.isFinite(szerokosc) || !Number.isFinite(dlugosc)) continue;
    if (szerokosc < POLSKA.minLat || szerokosc > POLSKA.maxLat) continue;
    if (dlugosc < POLSKA.minLon || dlugosc > POLSKA.maxLon) continue;
    return { szerokosc, dlugosc };
  }
  return null;
}

export type BlokKafelkow = {
  kafelki: { x: number; y: number }[];
  punkt: { x: number; y: number };
  zoom: number;
};

// Blok 2×2 kafelków (512×512 px) dobrany tak, by punkt wypadł w jego
// środkowej połowie. Przeglądarka składa go z czterech obrazków —
// dzięki temu nie ma potrzeby sklejania PNG-ów po naszej stronie.
export function kafelkiWokol(szerokosc: number, dlugosc: number, zoom: number): BlokKafelkow {
  const n = 2 ** zoom;
  const radiany = (szerokosc * Math.PI) / 180;
  const x = ((dlugosc + 180) / 360) * n;
  const y = ((1 - Math.log(Math.tan(radiany) + 1 / Math.cos(radiany)) / Math.PI) / 2) * n;

  const x0 = Math.floor(x - 0.5);
  const y0 = Math.floor(y - 0.5);
  return {
    zoom,
    kafelki: [
      { x: x0, y: y0 },
      { x: x0 + 1, y: y0 },
      { x: x0, y: y0 + 1 },
      { x: x0 + 1, y: y0 + 1 },
    ],
    punkt: { x: Math.round((x - x0) * 256), y: Math.round((y - y0) * 256) },
  };
}
