import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().optional().default('5000'),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().optional().default('gemini-2.0-flash'),
  GROQ_API_KEY: z.string().min(1, 'GROQ_API_KEY is required'),
  OPENROUTER_API_KEY: z.string().optional().default(''),
  OPENROUTER_MODEL: z.string().optional().default('openrouter/free'),
  CORS_ORIGIN: z.string().optional(),
  API_VERSION: z.string().optional().default('1.0.0'),
  RATE_LIMIT_WINDOW_MS: z.string().optional(),
  RATE_LIMIT_MAX: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment validation failed:', parsed.error.format());
  process.exit(1);
}

export const env = {
  node: parsed.data.NODE_ENV,
  port: Number(parsed.data.PORT),
  mongoUri: parsed.data.MONGO_URI,
  geminiApiKey: parsed.data.GEMINI_API_KEY,
  geminiModel: parsed.data.GEMINI_MODEL,
  groqApiKey: parsed.data.GROQ_API_KEY,
  openRouterApiKey: parsed.data.OPENROUTER_API_KEY,
  openRouterModel: parsed.data.OPENROUTER_MODEL,
  corsOrigin: parsed.data.CORS_ORIGIN,
  apiVersion: parsed.data.API_VERSION,
  rateLimitWindowMs: parsed.data.RATE_LIMIT_WINDOW_MS
    ? Number(parsed.data.RATE_LIMIT_WINDOW_MS)
    : undefined,
  rateLimitMax: parsed.data.RATE_LIMIT_MAX
    ? Number(parsed.data.RATE_LIMIT_MAX)
    : undefined,
  isProduction: parsed.data.NODE_ENV === 'production',
};
