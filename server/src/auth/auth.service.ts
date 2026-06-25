import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { UsersService } from '../users/users.service'
import { validateInitData } from '../common/telegram'
import { saveImage } from '../common/image-store'
import { User } from '../entities/user.entity'

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService,
  ) {}

  async loginWithTelegram(initData: string) {
    const botToken = this.cfg.get<string>('BOT_TOKEN')
    // Fail closed: без токена HMAC выводится из пустого секрета и initData можно подделать.
    if (!botToken) throw new UnauthorizedException('BOT_TOKEN не настроен')
    const ttl = Number(this.cfg.get('INITDATA_TTL') ?? 86400)
    let tg
    try {
      tg = validateInitData(initData, botToken, ttl)
    } catch (e) {
      throw new UnauthorizedException((e as Error).message)
    }
    const user = await this.users.upsertFromTelegram(tg)
    return this.session(user)
  }

  /** Профиль владельца + ленивая подгрузка аватара из Bot API (если в БД пусто). */
  async getMe(userId: string) {
    const user = await this.users.getByIdOrFail(userId)
    if (!user.avatarUrl) {
      const url = await this.fetchAvatar(user.telegramId).catch(() => null)
      if (url) {
        await this.users.setAvatar(user.id, url)
        user.avatarUrl = url
      }
    }
    return this.users.selfView(user)
  }

  /** Скачивает аватар пользователя через Bot API и кладёт в /uploads. */
  private async fetchAvatar(telegramId: string): Promise<string | null> {
    const token = this.cfg.get<string>('BOT_TOKEN')
    if (!token) return null
    const api = `https://api.telegram.org/bot${token}`
    const r1: any = await fetch(`${api}/getUserProfilePhotos?user_id=${telegramId}&limit=1`).then((r) => r.json())
    const sizes = r1?.result?.photos?.[0]
    if (!sizes?.length) return null
    const fileId = sizes[sizes.length - 1].file_id // самый крупный размер
    const r2: any = await fetch(`${api}/getFile?file_id=${fileId}`).then((r) => r.json())
    const path = r2?.result?.file_path
    if (!path) return null
    const buf = Buffer.from(await (await fetch(`https://api.telegram.org/file/bot${token}/${path}`)).arrayBuffer())
    return saveImage({ buffer: buf, mimetype: 'image/jpeg', originalname: 'avatar.jpg' } as any)
  }

  /** Dev-вход без Telegram — только вне production и при DEV_FAKE_AUTH=true. */
  async devLogin(telegramId = '1000001', firstName = 'Dev User') {
    // Двойной гейт: даже если флаг случайно включён в проде — вход остаётся закрыт.
    if (process.env.NODE_ENV === 'production' || this.cfg.get('DEV_FAKE_AUTH') !== 'true') {
      throw new ForbiddenException('Dev-вход выключен')
    }
    const user = await this.users.upsertFromTelegram({
      id: Number(telegramId),
      first_name: firstName,
    })
    return this.session(user)
  }

  refresh(token: string) {
    let payload: any
    try {
      payload = this.jwt.verify(token, {
        secret: this.cfg.get('JWT_SECRET'),
        algorithms: ['HS256'],
      })
    } catch {
      throw new UnauthorizedException('Невалидный refresh-токен')
    }
    if (payload.typ !== 'refresh') throw new UnauthorizedException('Не refresh-токен')
    return {
      access: this.signAccess(payload.sub, payload.tg),
      refresh: this.signRefresh(payload.sub, payload.tg),
    }
  }

  private session(user: User) {
    return {
      access: this.signAccess(user.id, user.telegramId),
      refresh: this.signRefresh(user.id, user.telegramId),
      user,
    }
  }

  private signAccess(sub: string, tg: string) {
    return this.jwt.sign(
      { sub, tg },
      { secret: this.cfg.get('JWT_SECRET'), expiresIn: this.cfg.get('JWT_ACCESS_TTL') ?? '15m' },
    )
  }

  private signRefresh(sub: string, tg: string) {
    return this.jwt.sign(
      { sub, tg, typ: 'refresh' },
      { secret: this.cfg.get('JWT_SECRET'), expiresIn: this.cfg.get('JWT_REFRESH_TTL') ?? '30d' },
    )
  }
}
