import { AppError } from '../../errors/app-error';
import { logger } from '../../config/logger';
import {
  AIProvider,
  AIProviderMessage,
  AIProviderResult,
  isRetryableProviderError,
} from './ai-provider.interface';
import { groqProvider } from './groq.provider';
import { geminiProvider } from './gemini.provider';
import { openRouterProvider } from './openrouter.provider';

const DEFAULT_PROVIDERS: AIProvider[] = [
  groqProvider,
  geminiProvider,
  openRouterProvider,
];

/**
 * Provider gateway with the fixed priority chain:
 * Groq (primary) -> Gemini (fallback 1) -> OpenRouter (fallback 2).
 *
 * - Each provider is attempted at most once per request (no retry loops,
 *   no quota burning).
 * - Fallback happens only for availability/quota/network/timout failures
 *   (retryable). Validation and configuration errors surface immediately.
 * - Every provider receives the exact same grounded prompt (RAG is untouched
 *   by the chain; retrieval happens before this service is reached).
 * - When every provider fails, one clean application error is thrown:
 *   503 AI_SERVICES_UNAVAILABLE. Raw provider responses never leak.
 */
export class AiService {
  public constructor(
    private readonly providers: AIProvider[] = DEFAULT_PROVIDERS
  ) {}

  public async generateAnswer(
    messages: AIProviderMessage[]
  ): Promise<AIProviderResult> {
    for (const provider of this.providers) {
      if (!provider.isConfigured()) {
        logger.info(
          { provider: provider.name },
          '[AI] Skipping unconfigured provider'
        );
        continue;
      }

      logger.info(
        { provider: provider.name },
        `[AI] Trying provider: ${cap(provider.name)}`
      );

      try {
        const result = await provider.generateAnswer(messages);
        logger.info(
          { provider: provider.name },
          `[AI] ${cap(provider.name)} succeeded`
        );
        return result;
      } catch (error) {
        if (!isRetryableProviderError(error)) {
          throw error;
        }
        const status = error instanceof AppError ? error.statusCode : 'unknown';
        logger.warn(
          { provider: provider.name, status },
          `[AI] ${cap(provider.name)} failed; falling back to next provider`
        );
      }
    }

    throw new AppError(
      'AI services are temporarily unavailable. Please try again shortly.',
      503,
      { code: 'AI_SERVICES_UNAVAILABLE' }
    );
  }
}

function cap(value: string): string {
  if (value === 'openrouter') {
    return 'OpenRouter';
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export const aiService = new AiService();
