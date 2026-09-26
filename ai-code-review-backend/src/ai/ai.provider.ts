// src/ai/ai.provider.ts

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface AIProviderConfig {
  baseUrl: string;
  apiKey?: string;
  model: string;
}

export interface ChatCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json_object' | 'text';
}

export interface AIProvider {
  readonly name: string;
  chatCompletion(
    messages: ChatMessage[],
    config?: Partial<AIProviderConfig>,
    options?: ChatCompletionOptions,
  ): Promise<string>;
}
