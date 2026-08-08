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
  data TEXT NOT NULL,
  UNIQUE (konto_id, parafia_slug)
);
`;

export function otworzBaze(sciezka: string): DatabaseSync {
  const baza = new DatabaseSync(sciezka);
  baza.exec('PRAGMA foreign_keys = ON');
  baza.exec(SCHEMAT);
  return baza;
}
