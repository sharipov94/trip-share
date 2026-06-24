import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Activity } from '../entities/activity.entity'
import { ActivityVote } from '../entities/activity-vote.entity'
import { ActivityComment } from '../entities/activity-comment.entity'
import { ActivitiesService } from './activities.service'
import { ActivitiesController } from './activities.controller'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [TypeOrmModule.forFeature([Activity, ActivityVote, ActivityComment]), NotificationsModule],
  providers: [ActivitiesService],
  controllers: [ActivitiesController],
})
export class ActivitiesModule {}
