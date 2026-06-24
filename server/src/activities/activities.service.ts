import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Activity } from '../entities/activity.entity'
import { ActivityVote, VoteValue } from '../entities/activity-vote.entity'
import { ActivityComment } from '../entities/activity-comment.entity'
import { MembershipService } from '../common/membership.service'
import { NotificationsService } from '../notifications/notifications.service'
import { CreateActivityDto } from './dto/create-activity.dto'

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity) private readonly activities: Repository<Activity>,
    @InjectRepository(ActivityVote) private readonly votes: Repository<ActivityVote>,
    @InjectRepository(ActivityComment) private readonly comments: Repository<ActivityComment>,
    private readonly membership: MembershipService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(userId: string, tripId: string) {
    await this.membership.assertMember(userId, tripId)
    return this.activities.find({ where: { tripId }, order: { startTime: 'ASC' } })
  }

  async create(userId: string, tripId: string, dto: CreateActivityDto) {
    await this.membership.assertMember(userId, tripId)
    const activity = await this.activities.save(
      this.activities.create({
        tripId,
        creatorId: userId,
        title: dto.title,
        description: dto.description ?? null,
        activityUrl: dto.activityUrl ?? null,
        price: dto.price != null ? dto.price.toFixed(2) : null,
        currency: dto.currency ?? null,
        startTime: dto.startTime ? new Date(dto.startTime) : null,
        endTime: dto.endTime ? new Date(dto.endTime) : null,
      }),
    )
    // напоминания за 24ч/2ч до старта (если время в будущем)
    await this.notifications.scheduleActivityReminders(activity.id, activity.startTime)
    return activity
  }

  private async resolve(userId: string, activityId: string): Promise<Activity> {
    const activity = await this.activities.findOne({ where: { id: activityId } })
    if (!activity) throw new NotFoundException('Активность не найдена')
    await this.membership.assertMember(userId, activity.tripId)
    return activity
  }

  async getOne(userId: string, activityId: string) {
    const activity = await this.resolve(userId, activityId)
    const votes = await this.votes.find({ where: { activityId } })
    return { ...activity, votes }
  }

  /** Upsert голоса (один на участника). */
  async vote(userId: string, activityId: string, value: VoteValue) {
    await this.resolve(userId, activityId)
    const existing = await this.votes.findOne({ where: { activityId, userId } })
    if (existing) {
      existing.vote = value
      return this.votes.save(existing)
    }
    return this.votes.save(this.votes.create({ activityId, userId, vote: value }))
  }

  async complete(userId: string, activityId: string) {
    const activity = await this.resolve(userId, activityId)
    activity.status = 'completed'
    return this.activities.save(activity)
  }

  async update(userId: string, activityId: string, dto: Partial<CreateActivityDto>) {
    const activity = await this.resolve(userId, activityId)
    if (dto.title !== undefined) activity.title = dto.title
    if (dto.description !== undefined) activity.description = dto.description ?? null
    if (dto.activityUrl !== undefined) activity.activityUrl = dto.activityUrl ?? null
    if (dto.price !== undefined) activity.price = dto.price != null ? dto.price.toFixed(2) : null
    if (dto.currency !== undefined) activity.currency = dto.currency ?? null
    if (dto.startTime !== undefined) activity.startTime = dto.startTime ? new Date(dto.startTime) : null
    if (dto.endTime !== undefined) activity.endTime = dto.endTime ? new Date(dto.endTime) : null
    return this.activities.save(activity)
  }

  async listComments(userId: string, activityId: string) {
    await this.resolve(userId, activityId)
    return this.comments.find({ where: { activityId }, order: { createdAt: 'ASC' } })
  }

  async addComment(userId: string, activityId: string, body: string) {
    await this.resolve(userId, activityId)
    return this.comments.save(this.comments.create({ activityId, userId, body }))
  }
}
