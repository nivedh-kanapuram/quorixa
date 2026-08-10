import { openRouterConfig } from '../../config/openrouter';
import {
  AIProvider,
  AIProviderMessage,
  AIProviderResult,
} from './ai-provider.interface';
import { postProviderChatCompletion } from './provider-http';

class OpenRouterProvider implements AIProvider {
  public readonly name = 'openrouter' as const;

  public isConfigured(): boolean {
    return openRouterConfig.apiKey.trim().length > 0;
  }

  public async generateAnswer(
    messages: AIProviderMessage[]
  ): Promise<AIProviderResult> {
    const text = await postProviderChatCompletion({
      provider: 'openrouter',
      baseUrl: openRouterConfig.baseUrl,
      apiKey: openRouterConfig.apiKey,
      model: openRouterConfig.model,
      messages,
      timeoutMs: openRouterConfig.timeoutMs,
      temperature: openRouterConfig.temperature,
      maxOutputTokens: openRouterConfig.maxOutputTokens,
    });
    return { text, provider: this.name };
  }
}

export const openRouterProvider = new OpenRouterProvider();
