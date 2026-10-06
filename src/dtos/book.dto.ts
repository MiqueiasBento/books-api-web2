import { z } from 'zod';

export const createBookSchema = z.object({
  title: z.string().trim().min(1, 'O título é obrigatório').max(150),
  author: z.string().trim().min(1, 'O autor é obrigatório').max(100),
  publishedYear: z.number().int().min(1400).max(new Date().getFullYear()),
  available: z.boolean().optional().default(true),
});

export const replaceBookSchema = createBookSchema.extend({ available: z.boolean() });

export const updateBookSchema = createBookSchema.partial();

export type CreateBookDTO = z.infer<typeof createBookSchema>;
export type UpdateBookDTO = z.infer<typeof updateBookSchema>;
