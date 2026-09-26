// src/auth/dto/register.dto.ts
import { IsEmail, IsString, MaxLength, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'email must be a valid email address' })
  email: string;

  /**
   * Min 8 chars, at least one uppercase letter, one digit.
   * Adjust the regex to match your password policy.
   */
  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  @MaxLength(64)
  @Matches(/(?=.*[A-Z])(?=.*\d)/, {
    message: 'password must contain at least one uppercase letter and one digit',
  })
  password: string;
}
