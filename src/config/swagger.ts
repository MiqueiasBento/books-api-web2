import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';
import { z } from 'zod';
import { createBookSchema, replaceBookSchema, updateBookSchema } from '../dtos/book.dto.js';

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const jsonResponse = (description: string, schema: object) => ({
  description,
  content: { 'application/json': { schema } },
});
const errors = {
  400: jsonResponse('ID inválido', ref('Error')),
  404: jsonResponse('Livro não encontrado', ref('Error')),
  500: jsonResponse('Erro interno do servidor', ref('Error')),
};
const validationError = jsonResponse('Dados inválidos', ref('ValidationError'));
const bookExample = {
  title: 'Clean Code', author: 'Robert C. Martin', publishedYear: 2008, available: true,
};
const requestBody = (name: string, example: object) => ({
  required: true,
  content: { 'application/json': { schema: ref(name), example } },
});

export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Biblioteca API',
    version: '1.0.0',
    description: 'API REST para cadastro, consulta, atualização e exclusão de livros.',
  },
  // URL relativa permite usar a documentação na mesma origem, em qualquer porta.
  servers: [{ url: '/', description: 'Servidor atual' }],
  tags: [{ name: 'Books', description: 'Cadastro de livros' }, { name: 'Health' }],
  components: {
    schemas: {
      CreateBook: z.toJSONSchema(createBookSchema, { target: 'openapi-3.0', io: 'input' }),
      ReplaceBook: z.toJSONSchema(replaceBookSchema, { target: 'openapi-3.0', io: 'input' }),
      UpdateBook: z.toJSONSchema(updateBookSchema, { target: 'openapi-3.0', io: 'input' }),
      Book: {
        type: 'object',
        required: ['id', 'title', 'author', 'publishedYear', 'available', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$', example: '507f1f77bcf86cd799439011' },
          title: { type: 'string', example: bookExample.title },
          author: { type: 'string', example: bookExample.author },
          publishedYear: { type: 'integer', example: 2008 },
          available: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Error: {
        type: 'object', required: ['message'],
        properties: { message: { type: 'string' } },
      },
      ValidationError: {
        type: 'object', required: ['message', 'issues'],
        properties: {
          message: { type: 'string', example: 'Dados inválidos' },
          issues: { type: 'array', items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              path: { type: 'array', items: { oneOf: [{ type: 'string' }, { type: 'integer' }] } },
              message: { type: 'string' },
            },
            additionalProperties: true,
          } },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'], summary: 'Verifica se a API está disponível', operationId: 'health',
        responses: { 200: jsonResponse('API disponível', {
          type: 'object', properties: { status: { type: 'string', enum: ['ok'] } },
        }) },
      },
    },
    '/books': {
      get: {
        tags: ['Books'], summary: 'Lista livros', operationId: 'listBooks',
        parameters: [{ name: 'search', in: 'query', required: false,
          description: 'Busca por título ou autor, sem diferenciar maiúsculas e minúsculas.',
          schema: { type: 'string' } }],
        responses: {
          200: jsonResponse('Lista de livros', { type: 'array', items: ref('Book') }),
          500: errors[500],
        },
      },
      post: {
        tags: ['Books'], summary: 'Cria um livro', operationId: 'createBook',
        requestBody: requestBody('CreateBook', bookExample),
        responses: { 201: jsonResponse('Livro criado', ref('Book')), 422: validationError, 500: errors[500] },
      },
    },
    '/books/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, description: 'ObjectId do livro',
        schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' }, example: '507f1f77bcf86cd799439011' }],
      get: {
        tags: ['Books'], summary: 'Busca um livro pelo ID', operationId: 'getBook',
        responses: { 200: jsonResponse('Livro encontrado', ref('Book')), ...errors },
      },
      put: {
        tags: ['Books'], summary: 'Atualiza todos os campos de um livro', operationId: 'replaceBook',
        description: 'Exige title, author, publishedYear e available. Preserva o ID e a data de criação.',
        requestBody: requestBody('ReplaceBook', bookExample),
        responses: { 200: jsonResponse('Livro atualizado', ref('Book')), ...errors, 422: validationError },
      },
      patch: {
        tags: ['Books'], summary: 'Atualiza parcialmente um livro', operationId: 'updateBook',
        requestBody: requestBody('UpdateBook', { available: false }),
        responses: { 200: jsonResponse('Livro atualizado', ref('Book')), ...errors, 422: validationError },
      },
      delete: {
        tags: ['Books'], summary: 'Exclui um livro', operationId: 'deleteBook',
        responses: { 204: { description: 'Livro excluído; resposta sem corpo' }, ...errors },
      },
    },
  },
};

export function setupSwagger(app: Express): void {
  app.get('/api-docs.json', (_req, res) => res.json(swaggerDocument));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customSiteTitle: 'Biblioteca API — Swagger',
    swaggerOptions: { persistAuthorization: true, validatorUrl: null },
  }));
}
