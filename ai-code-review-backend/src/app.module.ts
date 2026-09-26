// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';   // ← registers JwtAuthGuard globally via APP_GUARD
import { ProjectsModule } from './projects/projects.module';
import { FilesModule } from './files/files.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ChatModule } from './chat/chat.module';
import { AIModule } from './ai/ai.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // ── Config (global) ──────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // ── Rate limiting ────────────────────────────────────────────────────────
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1_000,  limit: 10  },   // 10 req / sec
      { name: 'long',  ttl: 60_000, limit: 200 },   // 200 req / min
    ]),

    // ── Core (global PrismaService) ──────────────────────────────────────────
    PrismaModule,

    // ── Feature modules ──────────────────────────────────────────────────────
    // AuthModule registers JwtAuthGuard as APP_GUARD → every route protected
    AuthModule,
    ProjectsModule,
    FilesModule,
    ReviewsModule,
    ChatModule,
    AIModule,
    HealthModule,    // @Public() routes — liveness + readiness probes
  ],
  providers: [
    // Throttle guard runs alongside JwtAuthGuard (NestJS applies all APP_GUARDs)
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
