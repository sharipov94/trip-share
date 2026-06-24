import { IsOptional, IsString } from 'class-validator'

export class TelegramLoginDto {
  @IsString()
  initData: string
}

export class RefreshDto {
  @IsString()
  refresh: string
}

// Только для локальной отладки (DEV_FAKE_AUTH=true). В проде не работает.
export class DevLoginDto {
  @IsOptional() @IsString()
  telegramId?: string

  @IsOptional() @IsString()
  firstName?: string
}
