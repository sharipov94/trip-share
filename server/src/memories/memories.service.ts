import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { join } from 'path'
import { promises as fs } from 'fs'
import { Memory, MemoryPhase } from '../entities/memory.entity'
import { Activity } from '../entities/activity.entity'
import { MembershipService } from '../common/membership.service'
import { saveImage } from '../common/image-store'

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

@Injectable()
export class MemoriesService {
  constructor(
    @InjectRepository(Memory) private readonly memories: Repository<Memory>,
    @InjectRepository(Activity) private readonly activities: Repository<Activity>,
    private readonly membership: MembershipService,
  ) {}

  async create(
    userId: string,
    tripId: string,
    file: Express.Multer.File,
    opts: { phase?: MemoryPhase; activityId?: string; takenAt?: string },
  ): Promise<Memory> {
    await this.membership.assertMember(userId, tripId)
    if (!file) throw new BadRequestException('Файл не передан')
    // проверка по реальному mime, не по имени (см. docs/09-security.md §6)
    if (!ALLOWED.includes(file.mimetype)) throw new BadRequestException('Только изображения')

    const photoUrl = await saveImage(file)

    return this.memories.save(
      this.memories.create({
        tripId,
        userId,
        activityId: opts.activityId ?? null,
        photoUrl,
        memoryPhase: opts.phase ?? null,
        takenAt: opts.takenAt ? new Date(opts.takenAt) : new Date(),
      }),
    )
  }

  async list(userId: string, tripId: string): Promise<Memory[]> {
    await this.membership.assertMember(userId, tripId)
    return this.memories.find({ where: { tripId }, order: { takenAt: 'DESC' } })
  }

  async byActivity(userId: string, activityId: string): Promise<Memory[]> {
    const activity = await this.activities.findOne({ where: { id: activityId } })
    if (!activity) throw new NotFoundException('Активность не найдена')
    await this.membership.assertMember(userId, activity.tripId)
    return this.memories.find({ where: { activityId }, order: { takenAt: 'ASC' } })
  }

  async remove(userId: string, id: string): Promise<void> {
    const m = await this.memories.findOne({ where: { id } })
    if (!m) throw new NotFoundException('Фото не найдено')
    if (m.userId !== userId) throw new ForbiddenException('Нет доступа')
    // delete file (best-effort, don't fail if already gone)
    const UPLOAD_DIR = process.env.UPLOAD_DIR ?? '/app/uploads'
    const filename = m.photoUrl.replace(/^\/uploads\//, '')
    await fs.unlink(join(UPLOAD_DIR, filename)).catch(() => {})
    await this.memories.delete(id)
  }
}
