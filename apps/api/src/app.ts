import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import { router } from './routes/index.js';
import { errorHandler } from './shared/middlewares/errorHandler.js';

const app = express();

app.use(cors());
// Limite ampliado para permitir upload de logomarcas (clínica/convênio) em base64
app.use(express.json({ limit: '5mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', router);

app.use(errorHandler);

export { app };
