import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

/** Отправка сообщений пользователям через Telegram Bot API. */
@Injectable()
export class TelegramBotService {
  private readonly log = new Logger('TelegramBot')
  constructor(private readonly cfg: ConfigService) {}

  async sendMessage(chatId: string | number, text: string): Promise<boolean> {
    const token = this.cfg.get<string>('BOT_TOKEN')
    if (!token) return false
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
      })
      if (!res.ok) {
        // частый случай: пользователь не нажимал /start у бота — просто пропускаем
        this.log.warn(`sendMessage ${chatId}: ${res.status}`)
        return false
      }
      return true
    } catch (e) {
      this.log.error(`sendMessage failed: ${(e as Error).message}`)
      return false
    }
  }

  /** Like sendMessage, but returns the Telegram message_id (needed for reply-based context lookup). */
  async sendMessageGetId(chatId: string | number, text: string): Promise<number | null> {
    const token = this.cfg.get<string>('BOT_TOKEN')
    if (!token) return null
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
      })
      if (!res.ok) { this.log.warn(`sendMessageGetId ${chatId}: ${res.status}`); return null }
      const data = await res.json() as { result: { message_id: number } }
      return data.result.message_id
    } catch (e) {
      this.log.error(`sendMessageGetId failed: ${(e as Error).message}`)
      return null
    }
  }
}
