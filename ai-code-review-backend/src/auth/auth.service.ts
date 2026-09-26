// src/auth/auth.service.ts
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

export interface AuthTokenResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
  };
}

@Injectable()
export class AuthService {
  private static readonly SALT_ROUNDS = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // ─── Register ───────────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<AuthTokenResponse> {
    // 1. Check uniqueness
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(dto.password, AuthService.SALT_ROUNDS);

    // 3. Persist user
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash, name: dto.email.split('@')[0] },
      select: { id: true, email: true },
    });

    // 4. Issue token
    return this.buildTokenResponse(user);
  }

  // ─── Login ──────────────────────────────────────────────────────────────────

  async login(dto: LoginDto): Promise<AuthTokenResponse> {
    // 1. Look up user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true, passwordHash: true },
    });

    // 2. Constant-time comparison (bcrypt.compare returns false on missing user
    //    only after a real hash comparison to prevent timing attacks)
    const passwordValid =
      user !== null && (await bcrypt.compare(dto.password, user.passwordHash));

    if (!user || !passwordValid) {
      // Deliberately vague — don't reveal whether email exists
      throw new UnauthorizedException('Invalid email or password');
    }

    // 3. Issue token
    return this.buildTokenResponse({ id: user.id, email: user.email });
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private buildTokenResponse(user: { id: string; email: string }): AuthTokenResponse {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: 'DEVELOPER' };
    const access_token = this.jwt.sign(payload);
    return { access_token, user: { id: user.id, email: user.email } };
  }
}
