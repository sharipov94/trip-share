import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { Expense } from '../entities/expense.entity'
import { ExpenseParticipant } from '../entities/expense-participant.entity'
import { TripMember } from '../entities/trip-member.entity'
import { MembershipService } from '../common/membership.service'
import { fromCents, splitEqually, toCents } from '../common/money'
import { CreateExpenseDto } from './dto/create-expense.dto'

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense) private readonly expenses: Repository<Expense>,
    @InjectRepository(ExpenseParticipant) private readonly parts: Repository<ExpenseParticipant>,
    @InjectRepository(TripMember) private readonly members: Repository<TripMember>,
    private readonly membership: MembershipService,
    private readonly dataSource: DataSource,
  ) {}

  list(userId: string, tripId: string) {
    return this.membership.assertMember(userId, tripId).then(() =>
      this.expenses.find({ where: { tripId }, order: { createdAt: 'DESC' } }),
    )
  }

  async getOne(userId: string, expenseId: string) {
    const expense = await this.expenses.findOne({ where: { id: expenseId } })
    if (!expense) throw new NotFoundException('Расход не найден')
    await this.membership.assertMember(userId, expense.tripId)
    const participants = await this.parts.find({ where: { expenseId } })
    return { ...expense, participants }
  }

  async create(
    userId: string,
    tripId: string,
    dto: CreateExpenseDto,
    idempotencyKey?: string,
  ): Promise<Expense> {
    await this.membership.assertMember(userId, tripId)

    // идемпотентность: повтор того же ключа возвращает существующий расход
    if (idempotencyKey) {
      const existing = await this.expenses.findOne({ where: { payerId: userId, idempotencyKey } })
      if (existing) return existing
    }

    // участники разделения: заданные или все участники поездки
    let participantIds = dto.participantIds
    if (!participantIds?.length) {
      const all = await this.members.find({ where: { tripId } })
      participantIds = all.map((m) => m.userId)
    }

    const shares = splitEqually(toCents(dto.amount), participantIds)

    return this.dataSource.transaction(async (mgr) => {
      const expense = await mgr.save(
        mgr.create(Expense, {
          tripId,
          payerId: userId,
          title: dto.title ?? null,
          amount: dto.amount.toFixed(2),
          currency: dto.currency,
          category: (dto.category as any) ?? null,
          splitMode: (dto.splitMode as any) ?? 'equal',
          idempotencyKey: idempotencyKey ?? null,
        }),
      )
      const participants = Object.entries(shares).map(([uid, cents]) =>
        mgr.create(ExpenseParticipant, {
          expenseId: expense.id,
          userId: uid,
          amount: fromCents(cents),
          status: uid === userId ? 'settled' : 'pending',
        }),
      )
      await mgr.save(participants)
      return expense
    })
  }

  async settle(userId: string, expenseId: string): Promise<void> {
    const expense = await this.expenses.findOne({ where: { id: expenseId } })
    if (!expense) throw new NotFoundException('Расход не найден')
    await this.membership.assertMember(userId, expense.tripId)
    await this.parts.update(
      { expenseId, userId },
      { status: 'settled', settledAt: new Date() },
    )
  }
}
