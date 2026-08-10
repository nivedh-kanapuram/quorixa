import { groqConfig } from '../../config/groq';
import {
  AIProvider,
  AIProviderMessage,
  AIProviderResult,
} from './ai-provider.interface';
import { postProviderChatCompletion } from './provider-http';

class GroqProvider implements AIProvider {
  public readonly name = 'groq' as const;

  public isConfigured(): boolean {
    return groqConfig.apiKey.trim().length > 0;
  }

  public async generateAnswer(
    messages: AIProviderMessage[]
  ): Promise<AIProviderResult> {
    const text = await postProviderChatCompletion({
      provider: 'groq',
      baseUrl: groqConfig.baseUrl,
      apiKey: groqConfig.apiKey,
      model: groqConfig.model,
      messages,
      timeoutMs: groqConfig.timeoutMs,
      temperature: groqConfig.temperature,
      maxOutputTokens: groqConfig.maxOutputTokens,
    });
    return { text, provider: this.name };
  }
}

export const groqProvider = new GroqProvider();
