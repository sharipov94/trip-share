import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BingoMark } from '../entities/bingo-mark.entity'
import { MembershipService } from '../common/membership.service'
import { saveImage } from '../common/image-store'

export const BINGO_TASKS: { key: string; text: string }[] = [
  { key: 'cat', text: 'Местный кот' },
  { key: 'sunset', text: 'Закат' },
  { key: 'price', text: 'Странный ценник' },
  { key: 'group', text: 'Групповое фото' },
  { key: 'music', text: 'Уличный музыкант' },
  { key: 'graffiti', text: 'Граффити' },
  { key: 'tapas', text: 'Тарелка тапас' },
  { key: 'sea', text: 'Море' },
  { key: 'guide', text: 'Селфи с гидом' },
]
const KEYS = new Set(BINGO_TASKS.map((t) => t.key))
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

@Injectable()
export class BingoService {
  constructor(
    @InjectRepository(BingoMark) private readonly marks: Repository<BingoMark>,
    private readonly membership: MembershipService,
  ) {}

  async list(userId: string, tripId: string) {
    await this.membership.assertMember(userId, tripId)
    const done = await this.marks.find({ where: { tripId } })
    const byKey = new Map(done.map((d) => [d.taskKey, d]))
    return {
      tasks: BINGO_TASKS.map((t) => ({
        ...t,
        done: byKey.has(t.key),
        photoUrl: byKey.get(t.key)?.photoUrl ?? null,
      })),
      completed: done.length,
      total: BINGO_TASKS.length,
    }
  }

  /** Закрыть клетку bingo фотографией. */
  async uploadPhoto(userId: string, tripId: string, taskKey: string, file: Express.Multer.File) {
    await this.membership.assertMember(userId, tripId)
    if (!KEYS.has(taskKey)) throw new BadRequestException('Неизвестное задание')
    if (!file) throw new BadRequestException('Файл не передан')
    if (!ALLOWED.includes(file.mimetype)) throw new BadRequestException('Только изображения')

    const photoUrl = await saveImage(file)
    let mark = await this.marks.findOne({ where: { tripId, taskKey } })
    if (mark) mark.photoUrl = photoUrl
    else mark = this.marks.create({ tripId, taskKey, userId, photoUrl })
    await this.marks.save(mark)
    return this.list(userId, tripId)
  }

  async remove(userId: string, tripId: string, taskKey: string) {
    await this.membership.assertMember(userId, tripId)
    const mark = await this.marks.findOne({ where: { tripId, taskKey } })
    if (mark) await this.marks.remove(mark)
    return this.list(userId, tripId)
  }
}
