// src/files/files.controller.ts
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { ConfigurableFilesInterceptor } from './interceptors/multer-files.interceptor';

/**
 * All routes protected by the global JwtAuthGuard registered in AuthModule.
 *
 * File upload uses ConfigurableFilesInterceptor — a DI-aware wrapper around
 * NestJS FilesInterceptor that reads MAX_FILE_SIZE_MB from ConfigService at
 * injection time, not at decorator-parse time.
 */
@Controller('projects/:projectId/files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  /**
   * POST /api/v1/projects/:projectId/files
   * Content-Type: multipart/form-data
   * Multipart field: "files" (supports multiple files per request, max 50)
   *
   * ─── Example curl ────────────────────────────────────────────────────────
   * curl -X POST http://localhost:3000/api/v1/projects/<uuid>/files \
   *   -H "Authorization: Bearer <token>" \
   *   -F "files=@src/app.ts;filename=src/app.ts" \
   *   -F "files=@src/main.ts;filename=src/main.ts"
   *
   * ─── Response ─────────────────────────────────────────────────────────────
   * 201 { "count": 2, "uploaded": [
   *   { "id": "uuid", "path": "src/app.ts", "language": "TypeScript",
   *     "size": 1234, "hash": "abc...", "isNew": true },
   *   ...
   * ]}
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(ConfigurableFilesInterceptor)
  async uploadMany(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const uploaded = await this.filesService.uploadMany(projectId, files);
    return { count: uploaded.length, uploaded };
  }

  /**
   * GET /api/v1/projects/:projectId/files
   * Returns file metadata only (content excluded — can be megabytes).
   */
  @Get()
  findAll(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.filesService.findAll(projectId);
  }

  /**
   * GET /api/v1/projects/:projectId/files/:id
   * Returns full file record including the raw content (Text).
   */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.filesService.findOne(id);
  }

  /**
   * DELETE /api/v1/projects/:projectId/files/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.filesService.remove(id);
  }

  /**
   * POST /api/v1/projects/:projectId/files/:id/generate-tests
   * Analyzes a source file and generates a complete unit test suite.
   * Returns: { tests, suggestedFilename, framework, runner }
   */
  @Post(':id/generate-tests')
  @HttpCode(HttpStatus.OK)
  generateTests(@Param('id', ParseUUIDPipe) id: string) {
    return this.filesService.generateTests(id);
  }
}
