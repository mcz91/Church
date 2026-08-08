import { EMAIL } from '../src/lib/glosy.ts';

// Wstępna moderacja regułowa (dokument 07, decyzja 5): automat może
// samodzielnie odrzucać wyłącznie twarde przypadki — zawsze z powodem
// i kanałem odwołania; przypadki graniczne dostają tylko podpowiedź
// dla moderatora-człowieka. Status approved ustawia wyłącznie człowiek.

export type Klasyfikacja = {
  twarde: { regula: string; powod: string }[];
  podpowiedzi: string[];
};

// Ciąg co najmniej dziewięciu cyfr rozdzielanych najwyżej spacją lub
// myślnikiem — numer telefonu; nie łapie godzin (7:30) ani kodów
// pocztowych (5 cyfr).
const TELEFON = /(?:\+\d{2}[\s-]?)?\d(?:[\s-]?\d){8}/;

const WULGARYZMY = ['kurw', 'chuj', 'pierdol', 'jeba', 'spierdal', 'zjeb'];

const POROWNANIE_WYZNAN =
  /(lepsz|gorsz|prawdziwsz)\w*\s+(niż|od)[^.!?]*\b(wyznani|parafi|kośc|wspólnot|katolic|prawosław|protestan|ewangel|religi|luter)/i;

export function klasyfikujGlos(glos: { tekst?: string; pseudonim?: string }): Klasyfikacja {
  const twarde: Klasyfikacja['twarde'] = [];
  const podpowiedzi: string[] = [];
  const pola = [glos.tekst ?? '', glos.pseudonim ?? ''];

  for (const pole of pola) {
    if (TELEFON.test(pole)) {
      twarde.push({
        regula: 'telefon',
        powod: 'dane kontaktowe (numer telefonu) w treści publicznej',
      });
    }
    if (EMAIL.test(pole)) {
      twarde.push({ regula: 'email', powod: 'adres e-mail w treści publicznej' });
    }
    const male = pole.toLowerCase();
    if (WULGARYZMY.some((w) => male.includes(w))) {
      twarde.push({ regula: 'wulgaryzm', powod: 'wulgaryzm w treści publicznej' });
    }
    if (POROWNANIE_WYZNAN.test(pole)) {
      podpowiedzi.push('fraza porównująca wyznania lub wspólnoty — oceń kontekst wypowiedzi');
    }
  }
  return { twarde, podpowiedzi };
}
