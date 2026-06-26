import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Activity } from '../entities/activity.entity'
import { TripMember } from '../entities/trip-member.entity'
import { User } from '../entities/user.entity'
import { NotificationsService } from './notifications.service'
import { TelegramBotService } from './telegram-bot.service'
import { PhotoReminderService } from './photo-reminder.service'

@Module({
  imports: [TypeOrmModule.forFeature([Activity, TripMember, User])],
  providers: [NotificationsService, TelegramBotService, PhotoReminderService],
  exports: [NotificationsService, TelegramBotService, PhotoReminderService],
})
export class NotificationsModule {}
