// src/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { AIProvidersService } from './ai-providers.service';
import { AIProvidersController } from './ai-providers.controller';

@Module({
  providers: [AIService, AIProvidersService],
  controllers: [AIProvidersController],
  exports: [AIService, AIProvidersService],
})
export class AIModule {}
