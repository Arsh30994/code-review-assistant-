// src/ai/providers/groq.provider.ts
import { AIProviderConfig } from '../ai.provider';
import { BaseOpenAICompatibleProvider } from './base-openai-compatible.provider';

/**
 * Groq AI Provider (llama-3.3-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768, etc.).
 *
 * Env fallbacks:
 *   AI_BASE_URL   →  https://api.groq.com/openai/v1 (default)
 *   AI_API_KEY    →  gsk_...
 *   AI_MODEL      →  llama-3.3-70b-versatile (default)
 */
export class GroqProvider extends BaseOpenAICompatibleProvider {
  readonly name = 'Groq';

  static readonly DEFAULT_BASE_URL = 'https://api.groq.com/openai/v1';
  static readonly DEFAULT_MODEL = 'openai/gpt-oss-120b';

  constructor(config?: Partial<AIProviderConfig>) {
    super(
      {
        baseUrl: config?.baseUrl || GroqProvider.DEFAULT_BASE_URL,
        apiKey: config?.apiKey,
        model: config?.model || GroqProvider.DEFAULT_MODEL,
      },
      GroqProvider.name,
    );
  }
}
