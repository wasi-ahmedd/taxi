import dotenv from 'dotenv';

dotenv.config();

const defaultDatabaseUrl = 'postgresql://postgres:postgres@localhost:5432/taxi';

export const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || defaultDatabaseUrl,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  ownerCommissionPercent: Number(process.env.OWNER_COMMISSION_PERCENT || 20),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
};
