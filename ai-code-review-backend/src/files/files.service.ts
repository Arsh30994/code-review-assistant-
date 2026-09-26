// src/files/files.service.ts
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from '../ai/ai.service';
import { inferLanguage } from './utils/language-inferrer';
import {
  buildGenerateTestsUserPrompt,
  GENERATE_TESTS_SYSTEM_PROMPT,
} from './prompts/generate-tests-prompt';

export interface UploadedFileResult {
  id: string;
  path: string;
  language: string | null;
  size: number;
  hash: string;
  isNew: boolean;   // true = inserted, false = updated (content changed)
}

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
  ) {}

  // ─── Upload multiple files ─────────────────────────────────────────────────

  /**
   * Upsert each multer file into the DB under the given project.
   * `relativePath` is taken from `file.originalname`; callers may strip a
   * leading directory prefix by setting `file.originalname` before the call.
   */
  async uploadMany(
    projectId: string,
    files: Express.Multer.File[],
  ): Promise<UploadedFileResult[]> {
    if (!files?.length) {
      throw new BadRequestException('No files were provided in the request');
    }

    // Verify project exists (throws 404 if not)
    await this.assertProjectExists(projectId);

    const results: UploadedFileResult[] = [];

    for (const file of files) {
      const result = await this.upsertOne(projectId, file);
      results.push(result);
    }

    return results;
  }

  // ─── List files (metadata only) ───────────────────────────────────────────

  findAll(projectId: string) {
    return this.prisma.file.findMany({
      where: { projectId },
      orderBy: { path: 'asc' },
      select: {
        id: true,
        path: true,
        language: true,
        size: true,
        hash: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // ─── Single file with content ─────────────────────────────────────────────

  async findOne(id: string) {
    const file = await this.prisma.file.findUnique({ where: { id } });
    if (!file) throw new NotFoundException(`File ${id} not found`);
    return file;
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async remove(id: string) {
    const file = await this.prisma.file.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!file) throw new NotFoundException(`File ${id} not found`);
    return this.prisma.file.delete({ where: { id } });
  }

  // ─── Generate Tests ───────────────────────────────────────────────────────

  async generateTests(
    id: string,
  ): Promise<{ tests: string; suggestedFilename: string; framework: string; runner: string }> {
    const file = await this.prisma.file.findUnique({
      where: { id },
      select: { id: true, path: true, language: true, content: true },
    });
    if (!file) throw new NotFoundException(`File ${id} not found`);

    const UNTESTABLE = ['json', 'yaml', 'yml', 'toml', 'xml', 'csv', 'md', 'mdx', 'txt'];
    const ext = file.path.split('.').pop()?.toLowerCase() ?? '';
    if (UNTESTABLE.includes(ext)) {
      throw new BadRequestException(
        `Cannot generate tests for a ${ext.toUpperCase()} file. Select a source code file.`,
      );
    }

    const { prompt, frameworkInfo, suggestedTestFilename } = buildGenerateTestsUserPrompt(
      file.path,
      file.language,
      file.content,
    );

    try {
      this.logger.log(
        `Generating tests for "${file.path}" (${file.language ?? 'unknown'}) using ${frameworkInfo.framework}`,
      );

      const rawOutput = await this.aiService.chatCompletion(
        [
          { role: 'system', content: GENERATE_TESTS_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        undefined,
        { temperature: 0.2 },
      );

      // Strip any wrapping code-fence the model may have added
      const cleanedTests = rawOutput
        .replace(/^```[\w]*\s*/i, '')
        .replace(/\s*```$/,'')
        .trim();

      return {
        tests: cleanedTests,
        suggestedFilename: suggestedTestFilename,
        framework: frameworkInfo.framework,
        runner: frameworkInfo.runner,
      };
    } catch (err: any) {
      this.logger.error(`Test generation failed: ${err.message}`, err.stack);
      throw new InternalServerErrorException(`Failed to generate tests: ${err.message}`);
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async upsertOne(
    projectId: string,
    file: Express.Multer.File,
  ): Promise<UploadedFileResult> {
    // Normalize path: trim whitespace, replace backslashes, strip leading slashes
    const relativePath = file.originalname
      .trim()
      .replace(/\\/g, '/')
      .replace(/^\/+/, '');

    const content = file.buffer.toString('utf-8');
    const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');
    const language = inferLanguage(relativePath);
    const size = file.size;

    // Check for existing record to decide insert vs update
    const existing = await this.prisma.file.findUnique({
      where: { projectId_path: { projectId, path: relativePath } },
      select: { id: true, hash: true },
    });

    if (existing) {
      // Skip write if content is identical (same hash)
      if (existing.hash === hash) {
        return {
          id: existing.id,
          path: relativePath,
          language,
          size,
          hash,
          isNew: false,
        };
      }

      const updated = await this.prisma.file.update({
        where: { id: existing.id },
        data: { content, hash, size, language },
        select: { id: true },
      });

      return { id: updated.id, path: relativePath, language, size, hash, isNew: false };
    }

    const created = await this.prisma.file.create({
      data: { projectId, path: relativePath, content, hash, size, language: language ?? undefined },
      select: { id: true },
    });

    return { id: created.id, path: relativePath, language, size, hash, isNew: true };
  }

  private async assertProjectExists(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
  }
}
