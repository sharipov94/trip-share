import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { MemoriesService } from '../memories/memories.service'
import type { MemoryPhase } from '../entities/memory.entity'

interface TelegramPhoto { file_id: string; width: number; height: number; file_size?: number }
interface TelegramMessage {
  message_id: number
  from: { id: number }
  chat: { id: number }
  photo?: TelegramPhoto[]
  reply_to_message?: { message_id: number }
}
export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
}
interface PhotoContext { tripId: string; userId: string; phase: string; takenAt: string }

@Injectable()
export class BotUpdateService implements OnModuleInit {
  private readonly log = new Logger('BotUpdate')
  private redis!: Redis

  constructor(
    private readonly memories: MemoriesService,
    private readonly cfg: ConfigService,
  ) {}

  private redisConn() {
    return { host: process.env.REDIS_HOST ?? 'redis', port: Number(process.env.REDIS_PORT ?? 6379) }
  }

  onModuleInit() {
    this.redis = new Redis(this.redisConn())
    this.registerWebhook().catch((e) => this.log.error(`registerWebhook: ${(e as Error).message}`))
  }

  private async registerWebhook(): Promise<void> {
    const token = this.cfg.get<string>('BOT_TOKEN')
    const appUrl = this.cfg.get<string>('APP_URL') ?? 'https://trip-radar.ru'
    const secret = this.cfg.get<string>('BOT_WEBHOOK_SECRET') ?? ''
    if (!token) { this.log.warn('BOT_TOKEN not set — skipping webhook registration'); return }
    const url = `${appUrl}/api/v1/bot/webhook`
    const body: Record<string, string> = { url }
    if (secret) body.secret_token = secret
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json() as { ok: boolean; description?: string }
    if (data.ok) this.log.log(`Webhook registered: ${url}`)
    else this.log.warn(`setWebhook failed: ${data.description}`)
  }

  async handleUpdate(update: TelegramUpdate): Promise<void> {
    const msg = update.message
    if (!msg?.photo?.length) return
    const token = this.cfg.get<string>('BOT_TOKEN')
    if (!token) return

    const chatId = String(msg.from.id)
    const replyMsgId = msg.reply_to_message?.message_id

    let ctx: PhotoContext | null = null
    if (replyMsgId) {
      const raw = await this.redis.get(`photo_ctx:${chatId}:${replyMsgId}`)
      if (raw) ctx = JSON.parse(raw) as PhotoContext
    }

    if (!ctx) {
      await this.sendText(token, msg.chat.id, 'Пожалуйста, ответь на сообщение с напоминанием 🙏')
      return
    }

    // Telegram returns photos in ascending quality; last item has best resolution
    const fileId = msg.photo[msg.photo.length - 1].file_id
    const multerFile = await this.downloadPhoto(token, fileId)
    if (!multerFile) {
      await this.sendText(token, msg.chat.id, 'Не удалось скачать фото, попробуй ещё раз')
      return
    }

    try {
      await this.memories.create(ctx.userId, ctx.tripId, multerFile, { phase: ctx.phase as MemoryPhase, takenAt: ctx.takenAt })
      await this.sendText(token, msg.chat.id, '✅ Фото сохранено!')
    } catch (e) {
      this.log.error(`create memory: ${(e as Error).message}`)
      await this.sendText(token, msg.chat.id, 'Что-то пошло не так, попробуй ещё раз')
    }
  }

  private async downloadPhoto(token: string, fileId: string): Promise<Express.Multer.File | null> {
    try {
      const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`)
      const { result } = await fileRes.json() as { result: { file_path: string } }
      const photoRes = await fetch(`https://api.telegram.org/file/bot${token}/${result.file_path}`)
      const buffer = Buffer.from(await photoRes.arrayBuffer())
      return { buffer, mimetype: 'image/jpeg', originalname: 'photo.jpg', fieldname: 'photo', encoding: '7bit', size: buffer.length } as Express.Multer.File
    } catch (e) {
      this.log.error(`downloadPhoto: ${(e as Error).message}`)
      return null
    }
  }

  private async sendText(token: string, chatId: number, text: string): Promise<void> {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    })
  }
}
