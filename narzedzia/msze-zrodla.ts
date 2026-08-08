import { parsujMszeISP } from './parser-archidiecezji.ts';
import type { MszeISP } from './parser-archidiecezji.ts';
import { parsujMszeJoomla, parsujMszeWordPress, znajdzPodstroneMszy } from './parser-tresci.ts';

// Wspólna droga pozyskania godzin mszy ze strony parafii: moduł ISP na
// stronie głównej, a gdy go nie ma — podstrona mszy z menu, czytana
// parserami ISP/WordPress/Joomla. Struktura nieznana daje null.
export type WynikMszy = { msze: MszeISP; url: string };

export async function pobierzMszeZeZrodel(
  www: string,
  pobierz: (url: string) => string,
  odczekaj: () => Promise<void>,
): Promise<WynikMszy | null> {
  await odczekaj();
  const glowna = pobierz(www);
  const zGlownej = parsujMszeISP(glowna);
  if (zGlownej) return { msze: zGlownej, url: www };

  const link = znajdzPodstroneMszy(glowna);
  if (!link) return null;
  const urlPodstrony = new URL(link, www).href;
  await odczekaj();
  const podstrona = pobierz(urlPodstrony);
  const msze =
    parsujMszeISP(podstrona) ?? parsujMszeWordPress(podstrona) ?? parsujMszeJoomla(podstrona);
  return msze ? { msze, url: urlPodstrony } : null;
}
