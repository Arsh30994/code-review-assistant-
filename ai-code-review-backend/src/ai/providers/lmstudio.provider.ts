// src/ai/providers/lmstudio.provider.ts
import { AIProviderConfig } from '../ai.provider';
import { BaseOpenAICompatibleProvider } from './base-openai-compatible.provider';

/**
 * LM Studio provider — connects to local LM Studio server at localhost:1234.
 *
 * Env fallbacks:
 *   AI_BASE_URL  →  http://localhost:1234/v1 (default)
 *   AI_API_KEY   →  (optional / ignored)
 *   AI_MODEL     →  local-model (or the loaded model identifier)
 */
export class LMStudioProvider extends BaseOpenAICompatibleProvider {
  readonly name = 'LM Studio';

  static readonly DEFAULT_BASE_URL = 'http://localhost:1234/v1';
  static readonly DEFAULT_MODEL = 'local-model';

  constructor(config?: Partial<AIProviderConfig>) {
    super(
      {
        baseUrl: config?.baseUrl || LMStudioProvider.DEFAULT_BASE_URL,
        apiKey: config?.apiKey || 'lm-studio',
        model: config?.model || LMStudioProvider.DEFAULT_MODEL,
      },
      LMStudioProvider.name,
    );
  }
}
