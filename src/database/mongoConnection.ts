import mongoose from 'mongoose';

export async function connectMongoDB(): Promise<void> {
  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) {
    throw new Error('MONGO_URL não configurada. Defina-a no arquivo .env com a URI do MongoDB Atlas.');
  }

  await mongoose.connect(mongoUrl);
  console.log('MongoDB conectado');
}
