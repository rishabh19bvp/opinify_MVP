"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(3001), // Default port for development
    MONGODB_URI: zod_1.z.string(),
    JWT_SECRET: zod_1.z.string(),
    JWT_EXPIRES_IN: zod_1.z.string().default('24h'),
    REFRESH_TOKEN_EXPIRES_IN: zod_1.z.string().default('7d'),
    NEWSAPI_API_KEY: zod_1.z.string().optional(),
    FIREBASE_SERVICE_ACCOUNT_PATH: zod_1.z.string().optional(),
    FIREBASE_DATABASE_URL: zod_1.z.string().optional(),
});
const env = envSchema.parse(process.env);
exports.config = {
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
