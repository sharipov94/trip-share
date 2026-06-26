import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Job, Queue, Worker } from 'bullmq'
import Redis from 'ioredis'
import { Trip } from '../entities/trip.entity'
import { TripMember } from '../entities/trip-member.entity'
import { User } from '../entities/user.entity'
import { TelegramBotService } from './telegram-bot.service'

export interface SlotSchedule {
  key: string      // 'before_trip' | 'day_1' | 'day_2' | ... | 'after_trip'
  phase: string    // 'before_trip' | 'during_trip' | 'after_trip'
  takenAt: string  // ISO string, noon UTC of the slot's calendar date
  label: string    // 'До поездки' | 'День 1' | ... | 'После поездки'
  fireTime: Date   // 06:00 UTC on the notification day
}

/** Pure function — exported for tests. Builds all slot schedule entries for a trip. */
export function buildSlotSchedules(startDate: string, endDate: string): SlotSchedule[] {
  const slots: SlotSchedule[] = []
  const start = new Date(startDate + 'T00:00:00Z')
  const end = new Date(endDate + 'T00:00:00Z')
  const durationDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1

  // Before trip: notify at 06:00 UTC the day before startDate
  const beforeDay = new Date(start)
  beforeDay.setUTCDate(beforeDay.getUTCDate() - 1)
  const beforeFire = new Date(beforeDay); beforeFire.setUTCHours(6, 0, 0, 0)
  const beforeTakenAt = new Date(beforeDay); beforeTakenAt.setUTCHours(12, 0, 0, 0)
  slots.push({ key: 'before_trip', phase: 'before_trip', takenAt: beforeTakenAt.toISOString(), label: 'До поездки', fireTime: beforeFire })

  // Day N: notify at 06:00 UTC on each trip day
  for (let n = 1; n <= durationDays; n++) {
    const dayDate = new Date(start); dayDate.setUTCDate(dayDate.getUTCDate() + (n - 1))
    const dayFire = new Date(dayDate); dayFire.setUTCHours(6, 0, 0, 0)
    const dayTakenAt = new Date(dayDate); dayTakenAt.setUTCHours(12, 0, 0, 0)
    slots.push({ key: `day_${n}`, phase: 'during_trip', takenAt: dayTakenAt.toISOString(), label: `День ${n}`, fireTime: dayFire })
  }

  // After trip: notify at 06:00 UTC the day after endDate
  const afterDay = new Date(end); afterDay.setUTCDate(afterDay.getUTCDate() + 1)
  const afterFire = new Date(afterDay); afterFire.setUTCHours(6, 0, 0, 0)
  const afterTakenAt = new Date(afterDay); afterTakenAt.setUTCHours(12, 0, 0, 0)
  slots.push({ key: 'after_trip', phase: 'after_trip', takenAt: afterTakenAt.toISOString(), label: 'После поездки', fireTime: afterFire })

  return slots
}

interface PhotoReminderJob {
  tripId: string
  userId: string
  chatId: string      // user.telegramId (bigint stored as string)
  phase: string
  takenAt: string
  slotLabel: string
  tripTitle: string
}

const REDIS_CTX_TTL = 172800 // 48 h in seconds

@Injectable()
export class PhotoReminderService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger('PhotoReminder')
  private queue!: Queue<PhotoReminderJob>
  private worker!: Worker<PhotoReminderJob>
  private redis!: Redis

  constructor(
    @InjectRepository(TripMember) private readonly members: Repository<TripMember>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly telegram: TelegramBotService,
    private readonly cfg: ConfigService,
  ) {}

  private redisConn() {
    return { host: process.env.REDIS_HOST ?? 'redis', port: Number(process.env.REDIS_PORT ?? 6379) }
  }

  onModuleInit() {
    const conn = this.redisConn()
    this.queue = new Queue<PhotoReminderJob>('photo_reminders', { connection: conn })
    this.worker = new Worker<PhotoReminderJob>('photo_reminders', (job) => this.handleJob(job), { connection: conn })
    this.worker.on('failed', (job, err) => this.log.warn(`job ${job?.id} failed: ${err.message}`))
    this.redis = new Redis(conn)
  }

  /** Schedule photo reminder jobs for all current members × all slots. Idempotent (jobId deduplicates). */
  async scheduleForTrip(trip: Trip): Promise<void> {
    if (!trip.startDate || !trip.endDate) return
    const slots = buildSlotSchedules(trip.startDate, trip.endDate)
    const mems = await this.members.find({ where: { tripId: trip.id } })
    if (!mems.length) return
    const userList = await this.users.findByIds(mems.map((m) => m.userId))

    for (const slot of slots) {
      const baseDelay = slot.fireTime.getTime() - Date.now()
      for (const user of userList) {
        const randomOffset = Math.floor(Math.random() * 7_200_000) // 0–2 h
        const delay = baseDelay + randomOffset
        if (delay <= 0) continue // slot already passed
        const jobId = `photo_reminder:${trip.id}:${slot.key}:${user.id}`
        await this.queue.add(
          'photo_reminder',
          { tripId: trip.id, userId: user.id, chatId: user.telegramId, phase: slot.phase, takenAt: slot.takenAt, slotLabel: slot.label, tripTitle: trip.title },
          { delay, jobId, removeOnComplete: true, removeOnFail: true },
        )
      }
    }
    this.log.log(`Scheduled photo reminders for trip ${trip.id}`)
  }

  /** Cancel all pending photo reminder jobs for a trip. Pass the trip with the DATES TO CANCEL (may differ from current DB state). */
  async cancelForTrip(trip: Trip): Promise<void> {
    if (!trip.startDate || !trip.endDate) return
    const slots = buildSlotSchedules(trip.startDate, trip.endDate)
    const mems = await this.members.find({ where: { tripId: trip.id } })
    for (const slot of slots) {
      for (const mem of mems) {
        const jobId = `photo_reminder:${trip.id}:${slot.key}:${mem.userId}`
        const job = await this.queue.getJob(jobId)
        if (job) await job.remove()
      }
    }
    this.log.log(`Cancelled photo reminders for trip ${trip.id}`)
  }

  private async handleJob(job: Job<PhotoReminderJob>): Promise<void> {
    const { tripId, userId, chatId, phase, takenAt, slotLabel, tripTitle } = job.data
    const text =
      `📷 <b>${esc(tripTitle)}</b> — ${esc(slotLabel)}\n\n` +
      `Ответь на это сообщение своей фотографией — она попадёт в альбом поездки!`
    const msgId = await this.telegram.sendMessageGetId(chatId, text)
    if (!msgId) return
    const ctx = JSON.stringify({ tripId, userId, phase, takenAt })
    await this.redis.set(`photo_ctx:${chatId}:${msgId}`, ctx, 'EX', REDIS_CTX_TTL)
    this.log.debug(`Sent photo reminder to chatId=${chatId} slot=${phase} msgId=${msgId}`)
  }

  async onModuleDestroy() {
    await this.worker?.close()
    await this.queue?.close()
    await this.redis?.quit()
  }
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
