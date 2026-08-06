import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().optional().default('3000'),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
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
  isProduction: parsed.data.NODE_ENV === 'production',
};
