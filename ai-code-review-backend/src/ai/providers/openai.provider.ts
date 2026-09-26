// src/ai/providers/openai.provider.ts
import { AIProviderConfig } from '../ai.provider';
import { BaseOpenAICompatibleProvider } from './base-openai-compatible.provider';

/**
 * OpenAI provider (GPT-4o, GPT-4-turbo, GPT-3.5-turbo, etc.).
 *
 * Env fallbacks:
 *   AI_BASE_URL   →  https://api.openai.com/v1 (default)
 *   AI_API_KEY    →  sk-... (required for OpenAI)
 *   AI_MODEL      →  gpt-4o (default)
 */
export class OpenAIProvider extends BaseOpenAICompatibleProvider {
  readonly name = 'OpenAI';

  static readonly DEFAULT_BASE_URL = 'https://api.openai.com/v1';
  static readonly DEFAULT_MODEL = 'gpt-4o';

  constructor(config?: Partial<AIProviderConfig>) {
    super(
      {
        baseUrl: config?.baseUrl || OpenAIProvider.DEFAULT_BASE_URL,
        apiKey: config?.apiKey,
        model: config?.model || OpenAIProvider.DEFAULT_MODEL,
      },
      OpenAIProvider.name,
    );
  }
}
