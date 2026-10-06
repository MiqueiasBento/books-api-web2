import type { NextFunction, Request, Response } from 'express';
import { createBookSchema, replaceBookSchema, updateBookSchema } from '../dtos/book.dto.js';
import { BookService } from '../services/BookService.js';

const service = new BookService();

export class BookController {
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      res.json(await service.list(search));
    } catch (error) { next(error); }
  };

  show = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await service.findById(String(req.params.id))); } catch (error) { next(error); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json(await service.create(createBookSchema.parse(req.body))); } catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await service.update(String(req.params.id), updateBookSchema.parse(req.body))); } catch (error) { next(error); }
  };

  replace = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await service.update(String(req.params.id), replaceBookSchema.parse(req.body))); } catch (error) { next(error); }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try { await service.remove(String(req.params.id)); res.status(204).send(); } catch (error) { next(error); }
  };
}
