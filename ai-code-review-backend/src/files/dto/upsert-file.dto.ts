// src/files/dto/upsert-file.dto.ts
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertFileDto {
  @IsString()
  @MaxLength(500)
  path: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  language?: string;
}
