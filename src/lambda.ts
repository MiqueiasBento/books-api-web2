import serverlessExpress from '@codegenie/serverless-express';
import type { Context, Handler } from 'aws-lambda';
import { app } from './app.js';
import { connectMongoDB } from './database/mongoConnection.js';

const proxy = serverlessExpress({ app }) as unknown as (
  event: Parameters<Handler>[0],
  context: Context,
) => Promise<unknown>;
let databaseConnection: Promise<void> | undefined;

export const handler: Handler = async (event, context: Context) => {
  databaseConnection ??= connectMongoDB();
  try {
    await databaseConnection;
  } catch (error) {
    databaseConnection = undefined;
    throw error;
  }

  return proxy(event, context);
};
