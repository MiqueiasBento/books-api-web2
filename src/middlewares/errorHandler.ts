import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError.js';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) return res.status(422).json({ message: 'Dados inválidos', issues: error.issues });
  if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message });
  console.error(error);
  return res.status(500).json({ message: 'Erro interno do servidor' });
};
