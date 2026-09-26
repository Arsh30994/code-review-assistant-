// src/chat/chat.service.ts
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { MessageRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from '../ai/ai.service';
import { ChatMessage } from '../ai/ai.provider';
import { CreateSessionDto } from './dto/create-session.dto';
import { SendMessageDto } from './dto/send-message.dto';
import {
  buildChatSystemPromptWithContext,
  ChatRetrievedContext,
} from './prompts/chat-prompts';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  // Maximum character limit for injected file contents to avoid blowing context windows
  private static readonly MAX_INJECTED_CHARS = 24_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
  ) {}

  /**
   * POST /chat/sessions
   * Create a new chat session, optionally tied to a project.
   */
  async createSession(userId: string, dto: CreateSessionDto) {
    if (dto.projectId) {
      const project = await this.prisma.project.findFirst({
        where: { id: dto.projectId, ownerId: userId },
      });
      if (!project) {
        throw new NotFoundException(`Project ${dto.projectId} not found or unauthorized`);
      }
    }

    const sessionTitle =
      dto.title?.trim() ||
      (dto.projectId ? `Project Chat` : `General Chat`);

    return this.prisma.chatSession.create({
      data: {
        userId,
        projectId: dto.projectId ?? null,
        title: sessionTitle,
      },
      include: {
        project: { select: { id: true, name: true, language: true } },
      },
    });
  }

  /**
   * GET /chat/sessions
   * List all chat sessions for the authenticated user.
   */
  async findSessions(userId: string) {
    return this.prisma.chatSession.findMany({
      where: { userId },
      include: {
        project: { select: { id: true, name: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * GET /chat/sessions/:sessionId
   */
  async getSession(sessionId: string, userId: string) {
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        project: { select: { id: true, name: true, description: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!session) {
      throw new NotFoundException(`Chat session ${sessionId} not found`);
    }

    return session;
  }

  /**
   * GET /chat/sessions/:sessionId/messages
   * List messages in a session in chronological order.
   */
  async getMessages(sessionId: string, userId: string) {
    await this.getSession(sessionId, userId);

    return this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        tokensUsed: true,
        createdAt: true,
      },
    });
  }

  /**
   * POST /chat/sessions/:sessionId/messages
   * Heuristic RAG chat message processing.
   */
  async sendMessage(sessionId: string, userId: string, dto: SendMessageDto) {
    // 1. Verify session ownership and load project info
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        project: {
          include: {
            files: {
              select: { id: true, path: true, language: true, content: true, size: true },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Chat session ${sessionId} not found`);
    }

    // 2. Perform Heuristic Retrieval for Code Context
    const retrievedContext = this.retrieveCodeContext(session.project, dto.content);

    // 3. Build the System Prompt with Injected Codebase Context
    const systemPrompt = buildChatSystemPromptWithContext(retrievedContext);

    // 4. Retrieve recent message history (last 12 turns)
    const recentMessages = await this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });
    recentMessages.reverse();

    // 5. Persist the user's message immediately
    const userMessage = await this.prisma.message.create({
      data: {
        sessionId,
        role: MessageRole.USER,
        content: dto.content,
      },
    });

    // 6. Build the prompt message array for AI
    const chatTurns: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...recentMessages.map((m) => ({
        role: (m.role.toLowerCase() === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: m.content,
      })),
      { role: 'user', content: dto.content },
    ];

    // 7. Call AI service
    this.logger.log(
      `Sending chat completion (sessionId=${sessionId}, strategy=${retrievedContext.retrievalStrategy}, matchedFiles=${retrievedContext.matchedFiles.length})`,
    );

    const replyContent = await this.aiService.chatCompletion(chatTurns, undefined, {
      temperature: 0.7,
    });

    // 8. Persist assistant reply
    const assistantMessage = await this.prisma.message.create({
      data: {
        sessionId,
        role: MessageRole.ASSISTANT,
        content: replyContent,
      },
    });

    // 9. Update session title if first message and default title
    if (recentMessages.length === 0 && (!session.title || session.title.startsWith('Project Chat') || session.title.startsWith('General Chat'))) {
      const generatedTitle = dto.content.slice(0, 40).replace(/[\r\n]+/g, ' ') + (dto.content.length > 40 ? '...' : '');
      await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { title: generatedTitle, updatedAt: new Date() },
      });
    } else {
      await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });
    }

    return {
      userMessage,
      assistantMessage,
    };
  }

  /**
   * Lightweight Heuristic Code Retrieval:
   * 1. If query mentions filenames/paths, retrieve matched files.
   * 2. Otherwise, retrieve file tree + key files (package.json, schema, main, index, controllers).
   */
  private retrieveCodeContext(
    project: any,
    userQuery: string,
  ): ChatRetrievedContext {
    if (!project || !project.files || project.files.length === 0) {
      return {
        allFilePaths: [],
        matchedFiles: [],
        retrievalStrategy: project ? 'key_files_summary' : 'no_project',
      };
    }

    const allFiles: Array<{ id: string; path: string; language?: string | null; content: string }> =
      project.files;
    const allFilePaths = allFiles.map((f) => f.path);
    const queryLower = userQuery.toLowerCase();

    // ── Strategy A: Filename / Path mention match ──────────────────────────────
    const matchedFiles: typeof allFiles = [];
    let accumulatedChars = 0;

    for (const file of allFiles) {
      const fullPathLower = file.path.toLowerCase();
      const baseNameLower = file.path.split(/[\/\\]/).pop()?.toLowerCase() || '';

      // Check if user query mentions full path or file basename (min 3 chars to avoid false matches like 'c')
      const isMentioned =
        queryLower.includes(fullPathLower) ||
        (baseNameLower.length >= 3 && queryLower.includes(baseNameLower));

      if (isMentioned) {
        if (accumulatedChars + file.content.length <= ChatService.MAX_INJECTED_CHARS) {
          matchedFiles.push(file);
          accumulatedChars += file.content.length;
        }
      }
    }

    if (matchedFiles.length > 0) {
      return {
        projectName: project.name,
        projectDescription: project.description,
        allFilePaths,
        matchedFiles,
        retrievalStrategy: 'filename_match',
      };
    }

    // ── Strategy B: Fallback to Key Project Files ─────────────────────────────
    const keyFilePatterns = [
      /package\.json$/i,
      /schema\.prisma$/i,
      /dockerfile$/i,
      /readme(\.md)?$/i,
      /main\.(ts|js|py|go|rs|cpp)$/i,
      /index\.(ts|js|py|go|rs|cpp)$/i,
      /app\.module\.(ts|js)$/i,
      /app\.(ts|js|py)$/i,
      /controller\.(ts|js)$/i,
      /service\.(ts|js)$/i,
    ];

    const prioritizedKeyFiles: typeof allFiles = [];

    for (const pattern of keyFilePatterns) {
      for (const file of allFiles) {
        if (pattern.test(file.path) && !prioritizedKeyFiles.some((f) => f.id === file.id)) {
          if (accumulatedChars + file.content.length <= ChatService.MAX_INJECTED_CHARS) {
            prioritizedKeyFiles.push(file);
            accumulatedChars += file.content.length;
          }
        }
      }
    }

    // If still under budget and no key files found, grab first files up to budget
    if (prioritizedKeyFiles.length === 0) {
      for (const file of allFiles) {
        if (accumulatedChars + file.content.length <= ChatService.MAX_INJECTED_CHARS) {
          prioritizedKeyFiles.push(file);
          accumulatedChars += file.content.length;
        }
      }
    }

    return {
      projectName: project.name,
      projectDescription: project.description,
      allFilePaths,
      matchedFiles: prioritizedKeyFiles,
      retrievalStrategy: 'key_files_summary',
    };
  }
}
