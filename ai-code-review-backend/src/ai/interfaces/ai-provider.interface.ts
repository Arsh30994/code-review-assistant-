// src/ai/interfaces/ai-provider.interface.ts
export * from '../ai.provider';

export interface ChatCompletionOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface ChatCompletionResult {
  content: string;
  tokensUsed?: number;
  providerName: string;
  model: string;
}
