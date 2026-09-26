// src/auth/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

/** Routes decorated with @Public() skip the global JwtAuthGuard */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
