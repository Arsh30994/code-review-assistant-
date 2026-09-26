// src/ai/providers/base-openai-compatible.provider.ts
import OpenAI from 'openai';
import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { AIProvider, AIProviderConfig, ChatCompletionOptions, ChatMessage } from '../ai.provider';

export abstract class BaseOpenAICompatibleProvider implements AIProvider {
  abstract readonly name: string;
  readonly baseUrl: string;
  readonly apiKey?: string;
  readonly model: string;

  protected readonly logger: Logger;

  constructor(config: AIProviderConfig, loggerContext: string) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.logger = new Logger(loggerContext);
  }

  async chatCompletion(
    messages: ChatMessage[],
    overrideConfig?: Partial<AIProviderConfig>,
    options?: ChatCompletionOptions,
  ): Promise<string> {
    const baseUrl = overrideConfig?.baseUrl || this.baseUrl;
    const apiKey = overrideConfig?.apiKey || this.apiKey?.trim() || 'none';
    const model = overrideConfig?.model || this.model;

    this.logger.debug(
      `[${this.name}] chatCompletion → baseUrl=${baseUrl} model=${model} messages=${messages.length} format=${options?.responseFormat ?? 'text'}`,
    );

    const client = new OpenAI({
      baseURL: baseUrl,
      apiKey: apiKey,
      timeout: 120_000,
      maxRetries: 2,
    });

    try {
      const response = await client.chat.completions.create({
        model: model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: options?.temperature ?? 0.2,
        max_tokens: options?.maxTokens,
        ...(options?.responseFormat === 'json_object'
          ? { response_format: { type: 'json_object' } }
          : {}),
      });

      const choice = response.choices[0];
      if (!choice?.message?.content) {
        throw new Error('Provider returned an empty response');
      }

      return choice.message.content;
    } catch (err: any) {
      if (err?.status !== undefined) {
        this.logger.error(
          `[${this.name}] API error ${err.status}: ${err.message}`,
        );
      } else {
        this.logger.error(
          `[${this.name}] Request failed: ${err?.message ?? err}`,
        );
      }
      throw new ServiceUnavailableException(
        `AI provider "${this.name}" is unavailable: ${err?.message ?? 'unknown error'}`,
      );
    }
  }
}
