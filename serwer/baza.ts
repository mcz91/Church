import { DatabaseSync } from 'node:sqlite';

const SCHEMAT = `
CREATE TABLE IF NOT EXISTS konta (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  pseudonim TEXT,
  zweryfikowane INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS tokeny (
  token TEXT PRIMARY KEY,
  konto_id TEXT NOT NULL REFERENCES konta(id) ON DELETE CASCADE,
  parafia_slug TEXT,
  wygasa INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS glosy (
  id TEXT PRIMARY KEY,
  konto_id TEXT NOT NULL REFERENCES konta(id) ON DELETE CASCADE,
  parafia_slug TEXT NOT NULL,
  ocena_ogolna INTEGER NOT NULL,
  przyjecie INTEGER NOT NULL,
  muzyka INTEGER NOT NULL,
  z_dziecmi INTEGER NOT NULL,
  dostepnosc INTEGER NOT NULL,
  organizacja INTEGER NOT NULL,
  tekst TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  powod_odrzucenia TEXT,
  auto_odrzucone INTEGER NOT NULL DEFAULT 0,
  podpowiedz TEXT,
  data TEXT NOT NULL,
  utworzone INTEGER NOT NULL DEFAULT 0,
  UNIQUE (konto_id, parafia_slug)
);
CREATE TABLE IF NOT EXISTS zdjecia (
  id TEXT PRIMARY KEY,
  glos_id TEXT NOT NULL REFERENCES glosy(id) ON DELETE CASCADE,
  plik TEXT NOT NULL,
  alt TEXT NOT NULL,
  podpis TEXT
);
CREATE TABLE IF NOT EXISTS zgloszenia (
  id TEXT PRIMARY KEY,
  karta TEXT NOT NULL,
  tresc TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'otwarte',
  utworzone INTEGER NOT NULL
);
`;

export function otworzBaze(sciezka: string): DatabaseSync {
  const baza = new DatabaseSync(sciezka);
  baza.exec('PRAGMA foreign_keys = ON');
  baza.exec(SCHEMAT);
  return baza;
}
