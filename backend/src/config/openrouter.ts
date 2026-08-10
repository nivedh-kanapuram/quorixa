import { env } from './env';

export const openRouterConfig = {
  apiKey: env.openRouterApiKey,
  model: env.openRouterModel,
  baseUrl: 'https://openrouter.ai/api/v1',
  timeoutMs: 60000,
  maxOutputTokens: 2048,
  temperature: 0.3,
};
