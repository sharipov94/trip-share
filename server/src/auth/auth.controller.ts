import { Body, Controller, Get, Post } from '@nestjs/common'
import { AuthService } from './auth.service'
import { UsersService } from '../users/users.service'
import { Public } from '../common/decorators/public.decorator'
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator'
import { DevLoginDto, RefreshDto, TelegramLoginDto } from './dto/auth.dto'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Public()
  @Post('telegram')
  telegram(@Body() dto: TelegramLoginDto) {
    return this.auth.loginWithTelegram(dto.initData)
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refresh)
  }

  @Public()
  @Post('dev')
  dev(@Body() dto: DevLoginDto) {
    return this.auth.devLogin(dto.telegramId, dto.firstName)
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.getMe(user.id)
  }
}
