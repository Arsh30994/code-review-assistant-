// src/auth/dto/login.dto.ts
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'email must be a valid email address' })
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password: string;
}
