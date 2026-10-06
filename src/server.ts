import 'dotenv/config';
import { app } from './app.js';
import { connectMongoDB } from './database/mongoConnection.js';

const port = Number(process.env.PORT) || 3333;
const host = '0.0.0.0';

connectMongoDB()
  .then(() => app.listen(port, host, () => console.log(`API disponível na porta ${port}`)))
  .catch((error) => {
    console.error('Não foi possível conectar ao MongoDB:', error);
    process.exit(1);
  });
