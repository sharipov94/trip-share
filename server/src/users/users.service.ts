import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../entities/user.entity'
import { TelegramUser } from '../common/telegram'
import { encrypt, decrypt } from '../common/crypto'
import { UpdateMeDto } from './dto/update-me.dto'

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  findById(id: string) {
    return this.users.findOne({ where: { id } })
  }

  async getByIdOrFail(id: string) {
    const u = await this.findById(id)
    if (!u) throw new NotFoundException('Пользователь не найден')
    return u
  }

  /** Создаёт или обновляет пользователя по данным из Telegram initData. */
  async upsertFromTelegram(tg: TelegramUser): Promise<User> {
    let user = await this.users.findOne({ where: { telegramId: String(tg.id) } })
    if (!user) user = this.users.create({ telegramId: String(tg.id) })
    user.username = tg.username ?? user.username ?? null
    user.firstName = tg.first_name ?? user.firstName ?? null
    user.avatarUrl = tg.photo_url ?? user.avatarUrl ?? null
    return this.users.save(user)
  }

  async setAvatar(id: string, url: string) {
    await this.users.update({ id }, { avatarUrl: url })
  }

  async updateMe(id: string, dto: UpdateMeDto): Promise<User> {
    const user = await this.getByIdOrFail(id)
    const { paymentDetails, ...rest } = dto
    Object.assign(user, rest)
    if (paymentDetails !== undefined) user.paymentDetails = encrypt(paymentDetails)
    await this.users.save(user)
    return this.selfView(user)
  }

  /** Профиль владельца — реквизиты расшифрованы. */
  async selfView(idOrUser: string | User): Promise<User> {
    const user = typeof idOrUser === 'string' ? await this.getByIdOrFail(idOrUser) : idOrUser
    return { ...user, paymentDetails: decrypt(user.paymentDetails) }
  }

  /**
   * Публичный профиль — явный allowlist полей (см. docs/09-security.md §3).
   * Не «всё кроме paymentDetails»: так telegramId и любые будущие чувствительные
   * колонки не утекут случайно произвольному аутентифицированному пользователю.
   */
  async publicView(id: string): Promise<Pick<User, 'id' | 'firstName' | 'username' | 'avatarUrl'>> {
    const user = await this.getByIdOrFail(id)
    return {
      id: user.id,
      firstName: user.firstName,
      username: user.username,
      avatarUrl: user.avatarUrl,
    }
  }
}
