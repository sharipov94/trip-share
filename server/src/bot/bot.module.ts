import { Module } from '@nestjs/common'
import { MemoriesModule } from '../memories/memories.module'
import { BotUpdateService } from './bot-update.service'
import { BotWebhookController } from './bot-webhook.controller'

@Module({
  imports: [MemoriesModule],
  controllers: [BotWebhookController],
  providers: [BotUpdateService],
})
export class BotModule {}
