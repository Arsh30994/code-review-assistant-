// src/projects/projects.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

/**
 * All routes are protected by the global JwtAuthGuard registered in AuthModule.
 * No per-controller @UseGuards needed.
 */
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  /**
   * POST /api/v1/projects
   * Body: { name, description?, repoUrl?, language? }
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Request() req: any, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(req.user.id, dto);
  }

  /**
   * GET /api/v1/projects
   * Returns projects owned by the current user, each with file/review counts.
   */
  @Get()
  findAll(@Request() req: any) {
    return this.projectsService.findAll(req.user.id);
  }

  /**
   * GET /api/v1/projects/:id
   * Returns full project detail including the file list (content excluded).
   */
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.projectsService.findOne(id, req.user.id);
  }

  /**
   * PATCH /api/v1/projects/:id
   */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, req.user.id, dto);
  }

  /**
   * DELETE /api/v1/projects/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.projectsService.remove(id, req.user.id);
  }

  /**
   * POST /api/v1/projects/:id/generate-readme
   * Analyzes project files and generates a complete README.md
   */
  @Post(':id/generate-readme')
  @HttpCode(HttpStatus.OK)
  generateReadme(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.projectsService.generateReadme(id, req.user.id);
  }
}

