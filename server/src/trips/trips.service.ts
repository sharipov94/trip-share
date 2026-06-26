import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { randomBytes } from 'crypto'
import { In, Repository } from 'typeorm'
import { Trip } from '../entities/trip.entity'
import { TripMember } from '../entities/trip-member.entity'
import { MembershipService } from '../common/membership.service'
import { saveImage } from '../common/image-store'
import { CreateTripDto } from './dto/create-trip.dto'
import { UpdateTripDto } from './dto/update-trip.dto'
import { PhotoReminderService } from '../notifications/photo-reminder.service'

@Injectable()
export class TripsService {
  // простое in-memory хранилище инвайт-токенов (в проде → таблица trip_invites)
  private invites = new Map<string, string>() // token -> tripId

  constructor(
    @InjectRepository(Trip) private readonly trips: Repository<Trip>,
    @InjectRepository(TripMember) private readonly members: Repository<TripMember>,
    private readonly membership: MembershipService,
    private readonly photoReminder: PhotoReminderService,
  ) {}

  async create(userId: string, dto: CreateTripDto): Promise<Trip> {
    const trip = await this.trips.save(
      this.trips.create({
        title: dto.title,
        description: dto.description ?? null,
        tripType: (dto.tripType as any) ?? null,
        baseCurrency: dto.baseCurrency,
        startDate: dto.startDate ?? null,
        endDate: dto.endDate ?? null,
        ownerId: userId,
      }),
    )
    await this.members.save(this.members.create({ tripId: trip.id, userId, role: 'owner' }))
    if (trip.startDate && trip.endDate) {
      await this.photoReminder.scheduleForTrip(trip)
    }
    return trip
  }

  /**
   * Статус, выведенный из дат: до начала — planning, между — active, после
   * конца — finished. Если даты не заданы — оставляем сохранённый статус
   * (его можно выставить вручную). Считается на чтение, в БД не пишется.
   */
  private withDerivedStatus(trip: Trip): Trip {
    if (!trip.startDate && !trip.endDate) return trip
    const today = new Date().toISOString().slice(0, 10)
    let status: Trip['status']
    if (trip.endDate && today > trip.endDate) status = 'finished'
    else if (trip.startDate && today < trip.startDate) status = 'planning'
    else status = 'active'
    return { ...trip, status }
  }

  /** Поездки, где пользователь — участник. */
  async listForUser(userId: string): Promise<Trip[]> {
    const memberships = await this.members.find({ where: { userId } })
    const ids = memberships.map((m) => m.tripId)
    if (!ids.length) return []
    const trips = await this.trips.find({ where: { id: In(ids) }, order: { createdAt: 'DESC' } })
    return trips.map((t) => this.withDerivedStatus(t))
  }

  async getOne(userId: string, tripId: string): Promise<Trip> {
    await this.membership.assertMember(userId, tripId)
    const trip = await this.trips.findOne({ where: { id: tripId } })
    if (!trip) throw new NotFoundException('Поездка не найдена')
    return this.withDerivedStatus(trip)
  }

  async update(userId: string, tripId: string, dto: UpdateTripDto): Promise<Trip> {
    await this.membership.assertRole(userId, tripId, ['owner', 'admin'])
    const trip = await this.trips.findOneOrFail({ where: { id: tripId } })
    const oldStartDate = trip.startDate
    const oldEndDate = trip.endDate

    if (dto.title !== undefined) trip.title = dto.title
    if (dto.description !== undefined) trip.description = dto.description
    if (dto.tripType !== undefined) trip.tripType = dto.tripType as any
    if (dto.status !== undefined) trip.status = dto.status as any
    if (dto.startDate !== undefined) trip.startDate = dto.startDate
    if (dto.endDate !== undefined) trip.endDate = dto.endDate

    const saved = await this.trips.save(trip)

    const datesChanged = saved.startDate !== oldStartDate || saved.endDate !== oldEndDate
    if (datesChanged) {
      if (oldStartDate && oldEndDate) {
        await this.photoReminder.cancelForTrip({ ...saved, startDate: oldStartDate, endDate: oldEndDate } as Trip)
      }
      if (saved.startDate && saved.endDate) {
        await this.photoReminder.scheduleForTrip(saved)
      }
    }

    return saved
  }

  async setCover(userId: string, tripId: string, file: Express.Multer.File): Promise<{ coverUrl: string }> {
    // обложку может ставить любой участник (как фото/воспоминания), не только owner/admin
    await this.membership.assertMember(userId, tripId)
    if (!file) throw new BadRequestException('Файл не передан')
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic'].includes(file.mimetype))
      throw new BadRequestException('Только изображения')
    const trip = await this.trips.findOneOrFail({ where: { id: tripId } })
    trip.coverUrl = await saveImage(file)
    await this.trips.save(trip)
    return { coverUrl: trip.coverUrl }
  }

  async remove(userId: string, tripId: string): Promise<void> {
    await this.membership.assertRole(userId, tripId, ['owner'])
    await this.trips.delete({ id: tripId })
  }

  async members_(userId: string, tripId: string): Promise<TripMember[]> {
    await this.membership.assertMember(userId, tripId)
    return this.members.find({ where: { tripId } })
  }

  async createInvite(userId: string, tripId: string): Promise<{ token: string; deepLink: string }> {
    await this.membership.assertRole(userId, tripId, ['owner', 'admin'])
    const token = randomBytes(12).toString('hex')
    this.invites.set(token, tripId)
    const bot = process.env.BOT_USERNAME ?? 'Share_trip_bot'
    // открывает Main Mini App бота со start_param=token
    return { token, deepLink: `https://t.me/${bot}?startapp=${token}` }
  }

  async join(userId: string, token: string): Promise<Trip> {
    const tripId = this.invites.get(token)
    if (!tripId) throw new NotFoundException('Инвайт недействителен')
    const existing = await this.membership.getMembership(userId, tripId)
    if (!existing) {
      await this.members.save(this.members.create({ tripId, userId, role: 'member' }))
    }
    return this.trips.findOneOrFail({ where: { id: tripId } })
  }
}
