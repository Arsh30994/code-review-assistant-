// src/chat/dto/create-session.dto.ts
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;
}
