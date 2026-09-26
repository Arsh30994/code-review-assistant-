// src/reviews/dto/create-review.dto.ts
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export enum ReviewModeInput {
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  QUALITY = 'quality',
}

export enum ReviewScopeInput {
  FILE = 'file',
  FILES = 'files',
  PROJECT = 'project',
}

export class CreateReviewDto {
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  @IsEnum(ReviewModeInput, {
    message: 'mode must be one of: "security", "performance", "quality"',
  })
  mode: ReviewModeInput;

  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  @IsEnum(ReviewScopeInput, {
    message: 'scope must be one of: "file", "files", "project"',
  })
  scope: ReviewScopeInput;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  fileIds?: string[];
}
