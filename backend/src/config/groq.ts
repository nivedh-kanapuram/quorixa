import { env } from './env';

export const groqConfig = {
  apiKey: env.groqApiKey,
  model: 'openai/gpt-oss-20b',
  baseUrl: 'https://api.groq.com/openai/v1',
  timeoutMs: 60000,
  maxOutputTokens: 2048,
  temperature: 0.3,
};
