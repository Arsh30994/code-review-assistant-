// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

/**
 * Unauthenticated health endpoints.
 * Used by load balancers, Docker HEALTHCHECK, and k8s probes.
 *
 * All routes are marked @Public() to bypass the global JwtAuthGuard.
 */
@Public()
@Controller('health')
export class HealthController {
  /**
   * GET /api/v1/health
   * Basic liveness probe — the process is alive.
   */
  @Get()
  liveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    };
  }

  /**
   * GET /api/v1/health/ready
   * Readiness probe — extend this to check DB connectivity if needed.
   */
  @Get('ready')
  readiness() {
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }
}
