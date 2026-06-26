import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Public } from '../common/decorators/public.decorator'
import { BotUpdateService, TelegramUpdate } from './bot-update.service'

@Public()
@Controller('bot')
export class BotWebhookController {
  constructor(
    private readonly bot: BotUpdateService,
    private readonly cfg: ConfigService,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Headers('x-telegram-bot-api-secret-token') secret: string,
    @Body() body: TelegramUpdate,
  ): Promise<void> {
    const expected = this.cfg.get<string>('BOT_WEBHOOK_SECRET') ?? ''
    if (expected && secret !== expected) return
    await this.bot.handleUpdate(body)
  }
}
