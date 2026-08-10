import { AppError } from '../../errors/app-error';
import { logger } from '../../config/logger';
import { AIProviderMessage } from './ai-provider.interface';

export interface ProviderHttpOptions {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: AIProviderMessage[];
  timeoutMs: number;
  temperature: number;
  maxOutputTokens: number;
}

interface ProviderApiErrorBody {
  error?: { message?: string };
}

interface ProviderApiSuccessBody {
  choices?: Array<{ message?: { content?: string } }>;
}

/**
 * Shared OpenAI-compatible chat completion call for Groq / Gemini / OpenRouter.
 * Purpose: one fetch + timeout + error-mapping implementation, so every
 * provider behaves identically and no provider-specific JSON leaks upward.
 * Never logs the API key or request body; message count only.
 */
export async function postProviderChatCompletion(
  options: ProviderHttpOptions
): Promise<string> {
  logger.info(
    {
      provider: options.provider,
      model: options.model,
      messages: options.messages.length,
    },
    'AI generation started'
  );

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${options.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model,
        messages: options.messages,
        temperature: options.temperature,
        max_tokens: options.maxOutputTokens,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AppError(
        'The AI service took too long to respond. Please try again.',
        504
      );
    }
    throw new AppError(
      'The AI service is temporarily unavailable. Please try again.',
      503
    );
  } finally {
    clearTimeout(timeout);
  }

  logRateLimitStatus(response, options.provider);

  if (!response.ok) {
    throw await toProviderError(response, options.provider);
  }

  let body: ProviderApiSuccessBody;
  try {
    body = (await response.json()) as ProviderApiSuccessBody;
  } catch {
    throw new AppError('The AI service returned an invalid response.', 502);
  }

  const text = body.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new AppError('The AI service returned an empty response.', 502);
  }

  logger.info(
    { provider: options.provider, answerLength: text.length },
    'AI generation completed'
  );

  return text;
}

function logRateLimitStatus(response: Response, provider: string): void {
  const remainingRequests = response.headers.get(
    'x-ratelimit-remaining-requests'
  );
  const remainingTokens = response.headers.get('x-ratelimit-remaining-tokens');

  if (remainingRequests || remainingTokens) {
    logger.info(
      {
        provider,
        remaining_requests: remainingRequests,
        remaining_tokens: remainingTokens,
      },
      'Provider rate-limit status'
    );
  }
}

async function toProviderError(
  response: Response,
  provider: string
): Promise<AppError> {
  let providerMessage: string | undefined;
  try {
    const body = (await response.json()) as ProviderApiErrorBody;
    providerMessage = body.error?.message;
  } catch {
    providerMessage = undefined;
  }

  logger.error(
    { provider, status: response.status, provider_message: providerMessage },
    'Provider error'
  );

  if (response.status === 401 || response.status === 403) {
    return new AppError('AI service configuration is invalid.', 401);
  }
  if (response.status === 429) {
    return new AppError(
      'AI service is temporarily busy. Please try again shortly.',
      429
    );
  }
  if (response.status === 400) {
    return new AppError(
      'The AI service rejected the request. Please try again.',
      400
    );
  }
  return new AppError(
    'The AI service is temporarily unavailable. Please try again.',
    503
  );
}
