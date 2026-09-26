// src/ai/providers/ollama.provider.ts
import { AIProviderConfig } from '../ai.provider';
import { BaseOpenAICompatibleProvider } from './base-openai-compatible.provider';

/**
 * Ollama provider — connects to local Ollama server at localhost:11434.
 *
 * Env fallbacks:
 *   AI_BASE_URL  →  http://localhost:11434/v1 (default)
 *   AI_API_KEY   →  (optional / ignored)
 *   AI_MODEL     →  llama3 (default)
 */
export class OllamaProvider extends BaseOpenAICompatibleProvider {
  readonly name = 'Ollama';

  static readonly DEFAULT_BASE_URL = 'http://localhost:11434/v1';
  static readonly DEFAULT_MODEL = 'llama3';

  constructor(config?: Partial<AIProviderConfig>) {
    super(
      {
        baseUrl: config?.baseUrl || OllamaProvider.DEFAULT_BASE_URL,
        apiKey: config?.apiKey || 'ollama',
        model: config?.model || OllamaProvider.DEFAULT_MODEL,
      },
      OllamaProvider.name,
    );
  }
}
