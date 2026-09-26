// src/reviews/reviews.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * POST /reviews
   * Initiates and runs an AI code review for a project.
   */
  @Post('reviews')
  @HttpCode(HttpStatus.CREATED)
  create(@Request() req: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.id, dto);
  }

  /**
   * GET /projects/:projectId/reviews
   * Lists reviews for a specific project with summary preview and metadata.
   */
  @Get('projects/:projectId/reviews')
  findByProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Request() req: any,
  ) {
    return this.reviewsService.findByProject(req.user.id, projectId);
  }

  /**
   * GET /reviews/:id
   * Returns full review details including parsed issues JSON and recommendations.
   */
  @Get('reviews/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.reviewsService.findOne(req.user.id, id);
  }

  /**
   * GET /reviews
   * Search / filter reviews across user projects with full-text ILIKE search and filters.
   */
  @Get('reviews')
  search(@Request() req: any, @Query() queryDto: QueryReviewsDto) {
    return this.reviewsService.search(req.user.id, queryDto);
  }
}
