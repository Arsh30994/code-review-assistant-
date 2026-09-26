// src/projects/dto/create-project.dto.ts
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsUrl({}, { message: 'repoUrl must be a valid URL' })
  repoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  language?: string;
}
