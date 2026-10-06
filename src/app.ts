import express from 'express';
import { setupSwagger } from './config/swagger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { bookRoutes } from './routes/book.routes.js';

export const app = express();
app.use(express.json());
setupSwagger(app);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/books', bookRoutes);
app.use(errorHandler);
