// src/chat/dto/send-message.dto.ts
import { IsString, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  content: string;
}
