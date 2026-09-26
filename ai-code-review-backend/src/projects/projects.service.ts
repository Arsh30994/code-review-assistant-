// src/projects/projects.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from '../ai/ai.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  buildReadmeUserPrompt,
  README_SYSTEM_PROMPT,
} from './prompts/readme-prompt';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);
  private static readonly MAX_README_CONTEXT_CHARS = 30_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
  ) {}

  // ─── Create ─────────────────────────────────────────────────────────────────

  create(ownerId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: { ...dto, ownerId },
      select: projectSummarySelect,
    });
  }

  // ─── List ────────────────────────────────────────────────────────────────────

  findAll(ownerId: string) {
    return this.prisma.project.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      select: {
        ...projectSummarySelect,
        _count: { select: { files: true, reviews: true } },
      },
    });
  }

  // ─── Detail (with file list) ─────────────────────────────────────────────────

  async findOne(id: string, ownerId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: {
        ...projectSummarySelect,
        files: {
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
        },
        _count: { select: { reviews: true } },
      },
    });

    if (!project) throw new NotFoundException(`Project ${id} not found`);
    this.assertOwner(project.ownerId, ownerId);
    return project;
  }

  // ─── Update ──────────────────────────────────────────────────────────────────

  async update(id: string, ownerId: string, dto: UpdateProjectDto) {
    await this.assertExists(id, ownerId);
    return this.prisma.project.update({
      where: { id },
      data: dto,
      select: projectSummarySelect,
    });
  }

  // ─── Delete ──────────────────────────────────────────────────────────────────

  async remove(id: string, ownerId: string) {
    await this.assertExists(id, ownerId);
    return this.prisma.project.delete({ where: { id } });
  }

  // ─── Generate README ─────────────────────────────────────────────────────────

  async generateReadme(id: string, ownerId: string): Promise<{ readme: string }> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        files: {
          select: { id: true, path: true, language: true, content: true, size: true },
        },
      },
    });

    if (!project) throw new NotFoundException(`Project ${id} not found`);
    this.assertOwner(project.ownerId, ownerId);

    if (!project.files || project.files.length === 0) {
      throw new BadRequestException(
        'Cannot generate README for a project with no uploaded files. Please upload files first.',
      );
    }

    const fileTree = project.files.map((f) => f.path);
    const keyFiles = this.selectKeyFilesForReadme(project.files);

    const userPrompt = buildReadmeUserPrompt(
      project.name,
      project.description,
      fileTree,
      keyFiles,
    );

    try {
      this.logger.log(
        `Generating README for project "${project.name}" using ${keyFiles.length} key files`,
      );

      const response = await this.aiService.chatCompletion(
        [
          { role: 'system', content: README_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        undefined,
        { temperature: 0.3 },
      );

      // Clean surrounding markdown code fence if AI returned ```markdown ... ```
      const cleanedReadme = response
        .replace(/^```markdown\s*/i, '')
        .replace(/^```md\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '')
        .trim();

      return { readme: cleanedReadme };
    } catch (err: any) {
      this.logger.error(`README generation failed: ${err.message}`, err.stack);
      throw new InternalServerErrorException(
        `Failed to generate README: ${err.message}`,
      );
    }
  }

  // ─── Key Files Selection ─────────────────────────────────────────────────────

  private selectKeyFilesForReadme(
    files: Array<{ id: string; path: string; language?: string | null; content: string }>,
  ) {
    const keyPatterns = [
      /package\.json$/i,
      /schema\.prisma$/i,
      /\.env\.example$/i,
      /dockerfile$/i,
      /docker-compose\.ya?ml$/i,
      /main\.(ts|js|py|go|rs|cpp)$/i,
      /index\.(ts|js|py|go|rs|cpp)$/i,
      /app\.module\.(ts|js)$/i,
      /app\.(ts|js|py)$/i,
      /controller\.(ts|js)$/i,
      /routes?\.(ts|js)$/i,
      /service\.(ts|js)$/i,
    ];

    const prioritized: typeof files = [];
    let accumulated = 0;

    for (const pattern of keyPatterns) {
      for (const file of files) {
        if (pattern.test(file.path) && !prioritized.some((f) => f.id === file.id)) {
          if (accumulated + file.content.length <= ProjectsService.MAX_README_CONTEXT_CHARS) {
            prioritized.push(file);
            accumulated += file.content.length;
          }
        }
      }
    }

    // Fallback if no specific patterns matched
    if (prioritized.length === 0) {
      for (const file of files) {
        if (accumulated + file.content.length <= ProjectsService.MAX_README_CONTEXT_CHARS) {
          prioritized.push(file);
          accumulated += file.content.length;
        }
      }
    }

    return prioritized;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async assertExists(id: string, ownerId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: { ownerId: true },
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    this.assertOwner(project.ownerId, ownerId);
    return project;
  }

  private assertOwner(projectOwnerId: string, requesterId: string) {
    if (projectOwnerId !== requesterId) {
      throw new ForbiddenException('You do not own this project');
    }
  }
}

// ─── Shared select projection ─────────────────────────────────────────────────
const projectSummarySelect = {
  id: true,
  name: true,
  description: true,
  repoUrl: true,
  language: true,
  isActive: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
} as const;
