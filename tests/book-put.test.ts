import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { BookController } from '../src/controllers/BookController.js';
import { BookService } from '../src/services/BookService.js';
import { AppError } from '../src/errors/AppError.js';
import { swaggerDocument } from '../src/config/swagger.js';

const id = '507f1f77bcf86cd799439011';
const body = { title: 'Clean Code', author: 'Robert C. Martin', publishedYear: 2008, available: false };

async function replace(payload: object, bookId = id) {
  const json = vi.fn();
  const next = vi.fn();
  await new BookController().replace(
    { params: { id: bookId }, body: payload } as unknown as Request,
    { json } as unknown as Response,
    next,
  );
  return { json, next };
}

afterEach(() => vi.restoreAllMocks());

describe('Atualização completa de livros (PUT)', () => {
  it('envia todos os campos e retorna o livro atualizado', async () => {
    const book = { ...body, id };
    const update = vi.spyOn(BookService.prototype, 'update').mockResolvedValue(book as never);
    const { json, next } = await replace(body);
    expect(update).toHaveBeenCalledWith(id, body);
    expect(json).toHaveBeenCalledWith(book);
    expect(next).not.toHaveBeenCalled();
  });

  it.each(['title', 'author', 'publishedYear', 'available'])('rejeita a ausência de %s antes de atualizar', async field => {
    const update = vi.spyOn(BookService.prototype, 'update');
    const payload: Record<string, unknown> = { ...body };
    delete payload[field];
    const { json, next } = await replace(payload);
    expect(next.mock.calls[0][0]).toBeInstanceOf(ZodError);
    expect(update).not.toHaveBeenCalled();
    expect(json).not.toHaveBeenCalled();
  });

  it.each([400, 404])('encaminha o erro %s para o middleware', async status => {
    const error = new AppError('Falha na atualização', status);
    vi.spyOn(BookService.prototype, 'update').mockRejectedValue(error);
    const { json, next } = await replace(body);
    expect(next).toHaveBeenCalledWith(error);
    expect(json).not.toHaveBeenCalled();
  });

  it('documenta PUT com todos os campos obrigatórios', () => {
    expect(swaggerDocument.paths['/books/{id}'].put.requestBody.content['application/json'].schema)
      .toEqual({ $ref: '#/components/schemas/ReplaceBook' });
    expect(swaggerDocument.components.schemas.ReplaceBook.required)
      .toEqual(['title', 'author', 'publishedYear', 'available']);
  });
});
