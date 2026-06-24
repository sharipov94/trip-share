import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Queue, Worker } from 'bullmq'
import { Activity } from '../entities/activity.entity'
import { TripMember } from '../entities/trip-member.entity'
import { User } from '../entities/user.entity'
import { TelegramBotService } from './telegram-bot.service'

interface ReminderJob {
  activityId: string
  text: string // «через 24 часа» и т.п.
}

const OFFSETS = [
  { key: '24h', ms: 24 * 3600_000, text: 'через 24 часа' },
  { key: '2h', ms: 2 * 3600_000, text: 'через 2 часа' },
]

/**
 * Напоминания об активностях через BullMQ. Воркер крутится в этом же процессе
 * (экономим RAM). Очередь и воркер на одном Redis.
 */
@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger('Notifications')
  private queue!: Queue<ReminderJob>
  private worker!: Worker<ReminderJob>

  constructor(
    @InjectRepository(Activity) private readonly activities: Repository<Activity>,
    @InjectRepository(TripMember) private readonly members: Repository<TripMember>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly telegram: TelegramBotService,
  ) {}

  private connection() {
    return {
      host: process.env.REDIS_HOST ?? 'redis',
      port: Number(process.env.REDIS_PORT ?? 6379),
    }
  }

  onModuleInit() {
    const connection = this.connection()
    this.queue = new Queue('reminders', { connection })
    this.worker = new Worker<ReminderJob>('reminders', (job) => this.handle(job.data), {
      connection,
    })
    this.worker.on('failed', (job, err) => this.log.warn(`job ${job?.id} failed: ${err.message}`))
    this.log.log('reminders queue + worker started')
  }

  /** Запланировать напоминания за 24ч и 2ч до старта активности. */
  async scheduleActivityReminders(activityId: string, startTime: Date | null) {
    if (!startTime) return
    for (const o of OFFSETS) {
      const delay = startTime.getTime() - o.ms - Date.now()
      if (delay <= 0) continue
      await this.queue.add(
        'reminder',
        { activityId, text: o.text },
        { delay, jobId: `rem:${activityId}:${o.key}`, removeOnComplete: true, removeOnFail: true },
      )
    }
  }

  private async handle(data: ReminderJob) {
    const activity = await this.activities.findOne({ where: { id: data.activityId } })
    if (!activity || activity.status === 'cancelled' || activity.status === 'completed') return

    const members = await this.members.find({ where: { tripId: activity.tripId } })
    const ids = members.map((m) => m.userId)
    if (!ids.length) return
    const users = await this.users.findByIds(ids)

    const text = `🔔 <b>${escape(activity.title)}</b> — ${data.text}`
    for (const u of users) {
      await this.telegram.sendMessage(u.telegramId, text)
    }
  }

  async onModuleDestroy() {
    await this.worker?.close()
    await this.queue?.close()
  }
}

function escape(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
