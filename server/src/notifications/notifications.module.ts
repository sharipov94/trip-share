import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Activity } from '../entities/activity.entity'
import { TripMember } from '../entities/trip-member.entity'
import { User } from '../entities/user.entity'
import { NotificationsService } from './notifications.service'
import { TelegramBotService } from './telegram-bot.service'

@Module({
  imports: [TypeOrmModule.forFeature([Activity, TripMember, User])],
  providers: [NotificationsService, TelegramBotService],
  exports: [NotificationsService, TelegramBotService],
})
export class NotificationsModule {}
