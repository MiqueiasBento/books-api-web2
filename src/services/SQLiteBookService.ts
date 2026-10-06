import { sqliteDb } from '../database/connection.js';
import type { CreateBookDTO, UpdateBookDTO } from '../dtos/book.dto.js';
import type { Book } from '../entities/Book.js';
import { AppError } from '../errors/AppError.js';

type BookRow = {
  id: number;
  title: string;
  author: string;
  published_year: number;
  created_at: string;
  available: number;
};

const toBook = (row: BookRow): Book => ({
  id: row.id,
  title: row.title,
  author: row.author,
  publishedYear: row.published_year,
  available: Boolean(row.available),
  createdAt: row.created_at,
});

/** Implementação relacional de referência; não é usada pelas rotas atuais. */
export class SQLiteBookService {
  list(search?: string): Book[] {
    const rows = search
      ? sqliteDb.prepare('SELECT * FROM books WHERE title LIKE ? OR author LIKE ? ORDER BY id DESC').all(`%${search}%`, `%${search}%`)
      : sqliteDb.prepare('SELECT * FROM books ORDER BY id DESC').all();
    return (rows as BookRow[]).map(toBook);
  }

  findById(id: number): Book {
    const row = sqliteDb.prepare('SELECT * FROM books WHERE id = ?').get(id) as BookRow | undefined;
    if (!row) throw new AppError('Livro não encontrado', 404);
    return toBook(row);
  }

  create(data: CreateBookDTO): Book {
    const result = sqliteDb.prepare('INSERT INTO books (title, author, published_year, available) VALUES (?, ?, ?, ?)')
      .run(data.title, data.author, data.publishedYear, Number(data.available));
    return this.findById(Number(result.lastInsertRowid));
  }

  update(id: number, data: UpdateBookDTO): Book {
    const next = { ...this.findById(id), ...data };
    sqliteDb.prepare('UPDATE books SET title = ?, author = ?, published_year = ?, available = ? WHERE id = ?')
      .run(next.title, next.author, next.publishedYear, Number(next.available), id);
    return this.findById(id);
  }

  remove(id: number): void {
    this.findById(id);
    sqliteDb.prepare('DELETE FROM books WHERE id = ?').run(id);
  }
}
