import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Trip } from '../entities/trip.entity'
import { TripMember } from '../entities/trip-member.entity'
import { Activity } from '../entities/activity.entity'
import { Expense } from '../entities/expense.entity'
import { Memory } from '../entities/memory.entity'
import { MembershipService } from '../common/membership.service'

@Injectable()
export class SummaryService {
  constructor(
    @InjectRepository(Trip) private readonly trips: Repository<Trip>,
    @InjectRepository(TripMember) private readonly members: Repository<TripMember>,
    @InjectRepository(Activity) private readonly activities: Repository<Activity>,
    @InjectRepository(Expense) private readonly expenses: Repository<Expense>,
    @InjectRepository(Memory) private readonly memories: Repository<Memory>,
    private readonly membership: MembershipService,
  ) {}

  /** Агрегаты поездки для Travel Summary / Wrapped (считаются из БД). */
  async forTrip(userId: string, tripId: string) {
    await this.membership.assertMember(userId, tripId)
    const trip = await this.trips.findOneOrFail({ where: { id: tripId } })

    const [members, activities, photos] = await Promise.all([
      this.members.count({ where: { tripId } }),
      this.activities.count({ where: { tripId } }),
      this.memories.count({ where: { tripId } }),
    ])

    const expRows = await this.expenses.find({ where: { tripId } })
    const expensesTotal = expRows.reduce((s, e) => s + Number(e.amount), 0)

    let days = 0
    if (trip.startDate && trip.endDate) {
      days = Math.round((+new Date(trip.endDate) - +new Date(trip.startDate)) / 86400_000) + 1
    }

    return {
      tripTitle: trip.title,
      baseCurrency: trip.baseCurrency,
      days,
      members,
      activities,
      photos,
      expenses: expRows.length,
      expensesTotal: expensesTotal.toFixed(2),
    }
  }
}
