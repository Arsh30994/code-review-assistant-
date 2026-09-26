// src/reviews/reviews.service.ts
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReviewMode, ReviewScope, ReviewStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from '../ai/ai.service';
import { CreateReviewDto, ReviewModeInput, ReviewScopeInput } from './dto/create-review.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';
import {
  buildUserReviewPrompt,
  FileToReview,
  ReviewIssue,
  ReviewOutputSchema,
  SYSTEM_PROMPTS,
} from './prompts/review-prompts';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
  ) {}

  /**
   * Execute an AI code review for a project.
   */
  async create(userId: string, dto: CreateReviewDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, ownerId: userId },
      include: { files: true },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID "${dto.projectId}" not found or unauthorized`);
    }

    const { filesToReview, targetFileIds } = this.resolveScopeFiles(project.files, dto);
    const prismaMode = this.mapModeToPrisma(dto.mode);
    const prismaScope = this.mapScopeToPrisma(dto.scope);

    const activeProvider = await this.prisma.aIProvider.findFirst({
      where: { isActive: true },
    });

    const review = await this.prisma.review.create({
      data: {
        projectId: project.id,
        mode: prismaMode,
        scope: prismaScope,
        targetFileIds,
        fileId: dto.scope === ReviewScopeInput.FILE ? targetFileIds[0] : null,
        providerId: activeProvider?.id ?? null,
        status: ReviewStatus.IN_PROGRESS,
        summary: 'Review in progress...',
        recommendations: '',
        issues: [],
      },
    });

    const systemPrompt = SYSTEM_PROMPTS[dto.mode];
    const userPrompt = buildUserReviewPrompt(
      {
        id: project.id,
        name: project.name,
        description: project.description,
        files: filesToReview,
      },
      dto.mode,
    );

    try {
      this.logger.log(
        `Starting ${dto.mode.toUpperCase()} review for project "${project.name}" (reviewId: ${review.id}, files: ${filesToReview.length})`,
      );

      const aiResponse = await this.aiService.chatCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        undefined,
        {
          responseFormat: 'json_object',
          temperature: 0.2,
        },
      );

      const parsedResult = this.parseAndValidateReviewOutput(aiResponse);
      const score = this.calculateReviewScore(parsedResult.issues);

      const completedReview = await this.prisma.review.update({
        where: { id: review.id },
        data: {
          status: ReviewStatus.COMPLETED,
          summary: parsedResult.summary,
          recommendations: parsedResult.recommendations,
          issues: parsedResult.issues as unknown as Prisma.InputJsonValue,
          score,
        },
        include: {
          project: { select: { id: true, name: true } },
          provider: { select: { name: true, model: true } },
        },
      });

      this.logger.log(`Review ${review.id} completed successfully with score ${score}`);
      return completedReview;
    } catch (err: any) {
      this.logger.error(`Review ${review.id} failed: ${err.message}`, err.stack);

      await this.prisma.review.update({
        where: { id: review.id },
        data: {
          status: ReviewStatus.FAILED,
          summary: `Code review execution failed: ${err.message}`,
        },
      });

      throw new InternalServerErrorException(`Review processing failed: ${err.message}`);
    }
  }

  /**
   * GET /projects/:projectId/reviews
   * Lists reviews for a given project (id, mode, scope, summary preview, score, createdAt).
   */
  async findByProject(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, ownerId: userId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID "${projectId}" not found or unauthorized`);
    }

    const reviews = await this.prisma.review.findMany({
      where: { projectId },
      select: {
        id: true,
        status: true,
        mode: true,
        scope: true,
        score: true,
        summary: true,
        createdAt: true,
        updatedAt: true,
        provider: { select: { name: true, model: true } },
        file: { select: { id: true, path: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews.map((r) => ({
      id: r.id,
      status: r.status,
      mode: r.mode.toLowerCase(),
      scope: r.scope.toLowerCase(),
      score: r.score,
      summaryPreview: r.summary ? r.summary.slice(0, 180) + (r.summary.length > 180 ? '...' : '') : '',
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      provider: r.provider,
      file: r.file,
    }));
  }

  /**
   * GET /reviews/:id
   * Full review details (summary, issues JSON, recommendations, score, provider, project).
   */
  async findOne(userId: string, id: string) {
    const review = await this.prisma.review.findFirst({
      where: {
        id,
        project: { ownerId: userId },
      },
      include: {
        project: { select: { id: true, name: true, description: true } },
        provider: { select: { id: true, name: true, model: true } },
        file: { select: { id: true, path: true, language: true, size: true } },
      },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID "${id}" not found`);
    }

    return {
      id: review.id,
      status: review.status,
      mode: review.mode.toLowerCase(),
      scope: review.scope.toLowerCase(),
      targetFileIds: review.targetFileIds,
      summary: review.summary,
      recommendations: review.recommendations,
      issues: review.issues,
      score: review.score,
      tokensUsed: review.tokensUsed,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      project: review.project,
      provider: review.provider,
      file: review.file,
    };
  }

  /**
   * GET /reviews?query=...
   * Search / filter reviews across projects by search text, mode, scope, or projectId.
   */
  async search(userId: string, dto: QueryReviewsDto) {
    const skip = (dto.page - 1) * dto.limit;

    const where: Prisma.ReviewWhereInput = {
      project: {
        ownerId: userId,
        ...(dto.projectId ? { id: dto.projectId } : {}),
      },
      ...(dto.mode ? { mode: this.mapModeToPrisma(dto.mode) } : {}),
      ...(dto.scope ? { scope: this.mapScopeToPrisma(dto.scope) } : {}),
      ...(dto.query
        ? {
            OR: [
              { summary: { contains: dto.query, mode: 'insensitive' } },
              { recommendations: { contains: dto.query, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, reviews] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        select: {
          id: true,
          status: true,
          mode: true,
          scope: true,
          score: true,
          summary: true,
          createdAt: true,
          updatedAt: true,
          project: { select: { id: true, name: true } },
          provider: { select: { name: true, model: true } },
          file: { select: { id: true, path: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: dto.limit,
      }),
    ]);

    return {
      data: reviews.map((r) => ({
        id: r.id,
        status: r.status,
        mode: r.mode.toLowerCase(),
        scope: r.scope.toLowerCase(),
        score: r.score,
        summaryPreview: r.summary ? r.summary.slice(0, 180) + (r.summary.length > 180 ? '...' : '') : '',
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        project: r.project,
        provider: r.provider,
        file: r.file,
      })),
      pagination: {
        total,
        page: dto.page,
        limit: dto.limit,
        totalPages: Math.ceil(total / dto.limit),
      },
    };
  }

  private resolveScopeFiles(
    allFiles: FileToReview[],
    dto: CreateReviewDto,
  ): { filesToReview: FileToReview[]; targetFileIds: string[] } {
    if (dto.scope === ReviewScopeInput.FILE) {
      if (!dto.fileIds || dto.fileIds.length === 0) {
        throw new BadRequestException('fileIds array with at least 1 file ID is required when scope is "file"');
      }
      const targetFileId = dto.fileIds[0];
      const targetFile = allFiles.find((f) => f.id === targetFileId);
      if (!targetFile) {
        throw new NotFoundException(`File ID "${targetFileId}" not found in project`);
      }
      return {
        filesToReview: [targetFile],
        targetFileIds: [targetFile.id],
      };
    }

    if (dto.scope === ReviewScopeInput.FILES) {
      if (!dto.fileIds || dto.fileIds.length === 0) {
        throw new BadRequestException('fileIds array is required when scope is "files"');
      }
      const targetFiles = allFiles.filter((f) => dto.fileIds!.includes(f.id));
      if (targetFiles.length === 0) {
        throw new NotFoundException('None of the requested fileIds exist in this project');
      }
      return {
        filesToReview: targetFiles,
        targetFileIds: targetFiles.map((f) => f.id),
      };
    }

    // scope === 'project'
    if (allFiles.length === 0) {
      throw new BadRequestException('Project has no files uploaded to review. Please upload files first.');
    }

    return {
      filesToReview: allFiles,
      targetFileIds: allFiles.map((f) => f.id),
    };
  }

  private parseAndValidateReviewOutput(rawOutput: string): ReviewOutputSchema {
    let parsed: any;
    try {
      const cleaned = rawOutput
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      this.logger.error('Failed to parse AI output as JSON. Raw preview:', rawOutput.slice(0, 400));
      throw new Error('AI returned an invalid JSON response format');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('AI response is not a valid JSON object');
    }

    const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : 'Review completed.';
    const recommendations =
      typeof parsed.recommendations === 'string'
        ? parsed.recommendations.trim()
        : Array.isArray(parsed.recommendations)
        ? parsed.recommendations.join('\n')
        : '';

    const rawIssues: any[] = Array.isArray(parsed.issues) ? parsed.issues : [];

    const sanitizedIssues: ReviewIssue[] = rawIssues.map((issue, idx) => {
      let severity: ReviewIssue['severity'] = 'Low';
      const rawSev = String(issue.severity || '').toLowerCase();
      if (rawSev.includes('crit')) severity = 'Critical';
      else if (rawSev.includes('high')) severity = 'High';
      else if (rawSev.includes('med')) severity = 'Medium';
      else severity = 'Low';

      return {
        severity,
        title: issue.title ? String(issue.title).trim() : `Issue #${idx + 1}`,
        description: issue.description ? String(issue.description).trim() : '',
        file: issue.file ? String(issue.file).trim() : 'unknown',
        line: typeof issue.line === 'number' ? issue.line : null,
      };
    });

    return {
      summary,
      issues: sanitizedIssues,
      recommendations,
    };
  }

  private calculateReviewScore(issues: ReviewIssue[]): number {
    let deductions = 0;
    for (const issue of issues) {
      switch (issue.severity) {
        case 'Critical':
          deductions += 25;
          break;
        case 'High':
          deductions += 15;
          break;
        case 'Medium':
          deductions += 7;
          break;
        case 'Low':
          deductions += 2;
          break;
      }
    }
    return Math.max(0, Math.min(100, 100 - deductions));
  }

  private mapModeToPrisma(mode: ReviewModeInput): ReviewMode {
    switch (mode) {
      case ReviewModeInput.SECURITY:
        return ReviewMode.SECURITY;
      case ReviewModeInput.PERFORMANCE:
        return ReviewMode.PERFORMANCE;
      case ReviewModeInput.QUALITY:
      default:
        return ReviewMode.QUALITY;
    }
  }

  private mapScopeToPrisma(scope: ReviewScopeInput): ReviewScope {
    switch (scope) {
      case ReviewScopeInput.FILE:
        return ReviewScope.FILE;
      case ReviewScopeInput.FILES:
        return ReviewScope.FILES;
      case ReviewScopeInput.PROJECT:
      default:
        return ReviewScope.PROJECT;
    }
  }
}
