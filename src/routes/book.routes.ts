import { Router } from 'express';
import { BookController } from '../controllers/BookController.js';

const books = new BookController();
export const bookRoutes = Router();
bookRoutes.get('/', books.list);
bookRoutes.get('/:id', books.show);
bookRoutes.post('/', books.create);
bookRoutes.put('/:id', books.replace);
bookRoutes.patch('/:id', books.update);
bookRoutes.delete('/:id', books.remove);
