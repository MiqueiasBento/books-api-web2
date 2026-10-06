import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const databasePath = resolve(process.cwd(), 'data', 'biblioteca.db');
mkdirSync(dirname(databasePath), { recursive: true });

// Implementação relacional mantida para comparação. A API usa MongoDB.
export const sqliteDb = new Database(databasePath);
sqliteDb.pragma('journal_mode = WAL');

sqliteDb.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    published_year INTEGER NOT NULL,
    available INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);
