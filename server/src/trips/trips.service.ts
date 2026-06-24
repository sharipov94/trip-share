import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { randomBytes } from 'crypto'
import { In, Repository } from 'typeorm'
import { Trip } from '../entities/trip.entity'
import { TripMember } from '../entities/trip-member.entity'
import { MembershipService } from '../common/membership.service'
import { CreateTripDto } from './dto/create-trip.dto'
import { UpdateTripDto } from './dto/update-trip.dto'

@Injectable()
export class TripsService {
  // простое in-memory хранилище инвайт-токенов (в проде → таблица trip_invites)
  private invites = new Map<string, string>() // token -> tripId

  constructor(
    @InjectRepository(Trip) private readonly trips: Repository<Trip>,
    @InjectRepository(TripMember) private readonly members: Repository<TripMember>,
    private readonly membership: MembershipService,
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
    return trip
  }

  /** Поездки, где пользователь — участник. */
  async listForUser(userId: string): Promise<Trip[]> {
    const memberships = await this.members.find({ where: { userId } })
    const ids = memberships.map((m) => m.tripId)
    if (!ids.length) return []
    return this.trips.find({ where: { id: In(ids) }, order: { createdAt: 'DESC' } })
  }

  async getOne(userId: string, tripId: string): Promise<Trip> {
    await this.membership.assertMember(userId, tripId)
    const trip = await this.trips.findOne({ where: { id: tripId } })
    if (!trip) throw new NotFoundException('Поездка не найдена')
    return trip
  }

  async update(userId: string, tripId: string, dto: UpdateTripDto): Promise<Trip> {
    await this.membership.assertRole(userId, tripId, ['owner', 'admin'])
    const trip = await this.trips.findOneOrFail({ where: { id: tripId } })
    if (dto.title !== undefined) trip.title = dto.title
    if (dto.description !== undefined) trip.description = dto.description
    if (dto.tripType !== undefined) trip.tripType = dto.tripType as any
    if (dto.status !== undefined) trip.status = dto.status as any
    if (dto.startDate !== undefined) trip.startDate = dto.startDate
    if (dto.endDate !== undefined) trip.endDate = dto.endDate
    return this.trips.save(trip)
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
