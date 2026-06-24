import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator'

// Whitelist полей — нельзя протащить лишнее (см. docs/09-security.md §6).
export class UpdateMeDto {
  @IsOptional() @IsString() @MaxLength(128)
  firstName?: string

  @IsOptional() @IsString() @MaxLength(64)
  username?: string

  @IsOptional() @IsString()
  paymentDetails?: string

  @IsOptional() @IsString() @MaxLength(512)
  avatarUrl?: string

  @IsOptional() @IsIn(['sunset', 'neon', 'pastel', 'acid', 'auto'])
  theme?: string
}
