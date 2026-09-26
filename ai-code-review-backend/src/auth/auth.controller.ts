// src/auth/auth.controller.ts
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/register
   * Public — no JWT required.
   * Returns: { access_token, user: { id, email } }
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * POST /api/v1/auth/login
   * Public — no JWT required.
   * Returns: { access_token, user: { id, email } }
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * POST /api/v1/auth/logout
   * Protected — requires a valid JWT (handled by the global JwtAuthGuard).
   *
   * Implementation note — stateless logout:
   *   JWTs are self-contained; the server cannot truly invalidate them without
   *   a server-side store. Options:
   *     1. Short expiry (e.g. 15 min) + refresh-token rotation (recommended).
   *     2. Token blacklist in Redis: store jti (JWT ID) until exp, check on
   *        each request in JwtStrategy.validate().
   *     3. Simple: just tell the client to delete the token (done here).
   *
   * To upgrade to a Redis blacklist, inject the token's `jti` claim,
   * store it in Redis with TTL = remaining exp, and reject in validate().
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Request() req: any) {
    // Stateless: the server has nothing to invalidate.
    // The client must delete the token from storage.
    return {
      message: 'Logged out successfully. Please discard your token client-side.',
      userId: req.user.id,
    };
  }
}
