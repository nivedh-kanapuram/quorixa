import { env } from './env';

export const geminiConfig = {
  apiKey: env.geminiApiKey,
  model: env.geminiModel,
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
  timeoutMs: 60000,
  maxOutputTokens: 2048,
  temperature: 0.3,
};
