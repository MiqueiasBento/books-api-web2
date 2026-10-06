import { isValidObjectId } from 'mongoose';
import type { CreateBookDTO, UpdateBookDTO } from '../dtos/book.dto.js';
import { AppError } from '../errors/AppError.js';
import { BookModel } from '../models/BookModel.js';

function validateId(id: string): void {
  if (!isValidObjectId(id)) throw new AppError('ID inválido');
}

export class BookService {
  async list(search?: string) {
    const filter = search
      ? { $or: [{ title: { $regex: search, $options: 'i' } }, { author: { $regex: search, $options: 'i' } }] }
      : {};
    return BookModel.find(filter).sort({ createdAt: -1 });
  }

  async findById(id: string) {
    validateId(id);
    const book = await BookModel.findById(id);
    if (!book) throw new AppError('Livro não encontrado', 404);
    return book;
  }

  async create(data: CreateBookDTO) {
    return BookModel.create(data);
  }

  async update(id: string, data: UpdateBookDTO) {
    validateId(id);
    const book = await BookModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!book) throw new AppError('Livro não encontrado', 404);
    return book;
  }

  async remove(id: string): Promise<void> {
    validateId(id);
    const book = await BookModel.findByIdAndDelete(id);
    if (!book) throw new AppError('Livro não encontrado', 404);
  }
}
