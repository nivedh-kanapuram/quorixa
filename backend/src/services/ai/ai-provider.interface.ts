import { AppError } from '../../errors/app-error';

export type ProviderName = 'groq' | 'gemini' | 'openrouter';

export interface AIProviderMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIProviderResult {
  text: string;
  provider: ProviderName;
}

export interface AIProvider {
  readonly name: ProviderName;
  isConfigured(): boolean;
  generateAnswer(messages: AIProviderMessage[]): Promise<AIProviderResult>;
}

/**
 * Provider failures worth falling back on: quota (429), timeouts (504),
 * transient network/unavailable (503, 502) and other transient 5xx.
 * Everything else (validation 400, auth/config 401) is an application concern
 * and must surface immediately instead of burning fallback quota.
 */
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

export function isRetryableProviderError(error: unknown): boolean {
  return error instanceof AppError && RETRYABLE_STATUSES.has(error.statusCode);
}
