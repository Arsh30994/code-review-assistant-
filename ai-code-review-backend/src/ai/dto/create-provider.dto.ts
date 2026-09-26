// src/ai/dto/create-provider.dto.ts
import { IsBoolean, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateProviderDto {
  @IsString()
  @MaxLength(80)
  name: string;

  @IsUrl()
  baseUrl: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsString()
  @MaxLength(80)
  model: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
