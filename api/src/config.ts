import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001), // Default port for development
  MONGODB_URI: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('24h'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  NEWSAPI_API_KEY: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional(),
  FIREBASE_DATABASE_URL: z.string().optional(),
});

const env = envSchema.parse(process.env);

export const config = {
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  port: env.PORT,
  database: {
    uri: env.MONGODB_URI,
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  },
  server: {
    url: `http://localhost:${env.PORT}`,
  },
  newsapi: {
    apiKey: env.NEWSAPI_API_KEY || 'YOUR_NEWSAPI_KEY_HERE',
  },
  firebase: {
    serviceAccountPath: env.FIREBASE_SERVICE_ACCOUNT_PATH,
    databaseURL: env.FIREBASE_DATABASE_URL || 'https://opinify-default-rtdb.firebaseio.com',
  },
};
