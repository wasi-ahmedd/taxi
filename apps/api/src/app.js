import cors from 'cors';
import express from 'express';
import authRoutes from './routes/authRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import { env } from './config/env.js';

export const createApp = () => {
  const app = express();

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.use('/auth', authRoutes);
  app.use('/drivers', driverRoutes);
  app.use('/trips', tripRoutes);
  app.use('/reports', reportRoutes);

  return app;
};
