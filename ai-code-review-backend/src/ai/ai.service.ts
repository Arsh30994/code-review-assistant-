// src/ai/ai.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReviewStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AIProvider, AIProviderConfig, ChatMessage } from './ai.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { LMStudioProvider } from './providers/lmstudio.provider';
import { OllamaProvider } from './providers/ollama.provider';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Resolves the active AI provider from DB (isActive=true) or env fallbacks:
   *   - AI_BASE_URL (default: https://api.openai.com/v1)
   *   - AI_API_KEY  (optional)
   *   - AI_MODEL    (default: gpt-4o)
   *   - AI_PROVIDER (optional: 'openai' | 'lmstudio' | 'ollama')
   */
  async getActiveProvider(): Promise<AIProvider> {
    const dbProvider = await this.prisma.aIProvider.findFirst({
      where: { isActive: true },
    });

    if (dbProvider) {
      this.logger.debug(`Using DB AI provider: ${dbProvider.name} (${dbProvider.model})`);
      return this.instantiateProvider(dbProvider.name, {
        baseUrl: dbProvider.baseUrl,
        apiKey: dbProvider.apiKey ?? undefined,
        model: dbProvider.model,
      });
    }

    // Fallback to environment variables
    const baseUrl = this.configService.get<string>('AI_BASE_URL') || 'https://api.openai.com/v1';
    const apiKey = this.configService.get<string>('AI_API_KEY');
    const model = this.configService.get<string>('AI_MODEL') || 'gpt-4o';
    const providerType = this.configService.get<string>('AI_PROVIDER') || 'openai';

    this.logger.debug(`Using env AI fallback: ${providerType} (${baseUrl} / ${model})`);

    return this.instantiateProvider(providerType, {
      baseUrl,
      apiKey,
      model,
    });
  }

  /**
   * Factory method to instantiate the appropriate provider instance.
   */
  private instantiateProvider(nameOrType: string, config: AIProviderConfig): AIProvider {
    const normalized = nameOrType.toLowerCase();

    if (normalized.includes('lmstudio') || normalized.includes('lm-studio') || config.baseUrl.includes(':1234')) {
      return new LMStudioProvider(config);
    }

    if (normalized.includes('ollama') || config.baseUrl.includes(':11434')) {
      return new OllamaProvider(config);
    }

    return new OpenAIProvider(config);
  }

  /**
   * Send a chat completion request to the active provider.
   */
  async chat(
    messages: ChatMessage[],
    overrideConfig?: Partial<AIProviderConfig>,
    options?: ChatCompletionOptions,
  ): Promise<string> {
    const provider = await this.getActiveProvider();
    return provider.chatCompletion(messages, overrideConfig, options);
  }

  /**
   * Alias for chat matching interface naming.
   */
  async chatCompletion(
    messages: ChatMessage[],
    overrideConfig?: Partial<AIProviderConfig>,
    options?: ChatCompletionOptions,
  ): Promise<string> {
    return this.chat(messages, overrideConfig, options);
  }

  /**
   * Generate a structured code review and persist results in the database.
   */
  async generateReview(reviewId: string, code: string): Promise<void> {
    await this.prisma.review.update({
      where: { id: reviewId },
      data: { status: ReviewStatus.IN_PROGRESS },
    });

    const systemPrompt = `You are an expert senior code reviewer. Analyze the provided code for bugs, security vulnerabilities, performance bottlenecks, and style issues.
Respond ONLY with a valid JSON object matching this exact schema:
{
  "summary": "Brief executive summary of code quality and main concerns",
  "recommendations": "Actionable list of high-level improvements and refactoring suggestions",
  "score": <number between 0 and 100>,
  "issues": [
    {
      "severity": "critical" | "high" | "medium" | "low" | "info",
      "title": "Short title describing the issue",
      "description": "Detailed explanation of the problem and how to fix it",
      "file": "path/to/file.ext",
      "line": <line number or null>
    }
  ]
}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Please review the following code:\n\n\`\`\`\n${code}\n\`\`\`` },
    ];

    try {
      const responseText = await this.chat(messages);

      // Clean markdown code blocks if the AI enclosed JSON in ```json ... ```
      const cleanedJson = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '')
        .trim();

      let parsed: any;
      try {
        parsed = JSON.parse(cleanedJson);
      } catch (parseError) {
        this.logger.error('Failed to parse AI review output as JSON', responseText.slice(0, 300));
        throw new Error('AI returned an invalid JSON response format');
      }

      await this.prisma.review.update({
        where: { id: reviewId },
        data: {
          status: ReviewStatus.COMPLETED,
          summary: parsed.summary ?? '',
          recommendations: parsed.recommendations ?? '',
          issues: Array.isArray(parsed.issues) ? parsed.issues : [],
          score: typeof parsed.score === 'number' ? parsed.score : null,
        },
      });
    } catch (err: any) {
      this.logger.error(`Review generation failed for reviewId=${reviewId}: ${err.message}`, err.stack);
      await this.prisma.review.update({
        where: { id: reviewId },
        data: {
          status: ReviewStatus.FAILED,
          summary: `Code review failed: ${err.message}`,
        },
      });
      throw err;
    }
  }
}
