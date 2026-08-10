import { geminiConfig } from '../../config/gemini';
import {
  AIProvider,
  AIProviderMessage,
  AIProviderResult,
} from './ai-provider.interface';
import { postProviderChatCompletion } from './provider-http';

class GeminiProvider implements AIProvider {
  public readonly name = 'gemini' as const;

  public isConfigured(): boolean {
    return geminiConfig.apiKey.trim().length > 0;
  }

  public async generateAnswer(
    messages: AIProviderMessage[]
  ): Promise<AIProviderResult> {
    const text = await postProviderChatCompletion({
      provider: 'gemini',
      baseUrl: geminiConfig.baseUrl,
      apiKey: geminiConfig.apiKey,
      model: geminiConfig.model,
      messages,
      timeoutMs: geminiConfig.timeoutMs,
      temperature: geminiConfig.temperature,
      maxOutputTokens: geminiConfig.maxOutputTokens,
    });
    return { text, provider: this.name };
  }
}

export const geminiProvider = new GeminiProvider();
