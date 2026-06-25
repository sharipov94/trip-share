import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { Expense } from '../entities/expense.entity'
import { ExpenseParticipant } from '../entities/expense-participant.entity'
import { Settlement } from '../entities/settlement.entity'
import { MembershipService } from '../common/membership.service'
import { fromCents, minimizeTransfers, toCents } from '../common/money'

@Injectable()
export class BalanceService {
  constructor(
    @InjectRepository(Expense) private readonly expenses: Repository<Expense>,
    @InjectRepository(ExpenseParticipant) private readonly parts: Repository<ExpenseParticipant>,
    @InjectRepository(Settlement) private readonly settlements: Repository<Settlement>,
    private readonly membership: MembershipService,
  ) {}

  async computeForTrip(userId: string, tripId: string) {
    await this.membership.assertMember(userId, tripId)

    const expenses = await this.expenses.find({ where: { tripId } })
    const expenseIds = expenses.map((e) => e.id)
    const parts = expenseIds.length
      ? await this.parts.find({ where: { expenseId: In(expenseIds) } })
      : []
    const settled = await this.settlements.find({ where: { tripId, status: 'settled' } })

    // net = оплачено - доля (только pending). В центах.
    const net: Record<string, number> = {}
    const add = (uid: string, c: number) => (net[uid] = (net[uid] ?? 0) + c)

    for (const e of expenses) add(e.payerId, toCents(e.amount))
    for (const p of parts) {
      if (p.status === 'pending') add(p.userId, -toCents(p.amount))
    }
    // наличный перевод должник→кредитор гасит часть долга:
    // должник (from) поднимает свой net к нулю, кредитор (to) — опускает.
    for (const s of settled) {
      add(s.fromUser, toCents(s.amount))
      add(s.toUser, -toCents(s.amount))
    }

    const transfers = minimizeTransfers(net).map((t) => ({
      from: t.from,
      to: t.to,
      amount: fromCents(t.amount),
    }))

    const balances = Object.fromEntries(
      Object.entries(net).map(([id, c]) => [id, fromCents(c)]),
    )

    return { tripId, balances, transfers }
  }

  /**
   * Зафиксировать наличный перевод fromUser→toUser. Звонящий должен быть одним
   * из участников перевода; оба обязаны состоять в поездке. Перевод сразу
   * 'settled' (самоотчёт), что гасит соответствующий долг в балансе.
   */
  async record(userId: string, tripId: string, dto: { fromUser: string; toUser: string; amount: number }) {
    await this.membership.assertMember(userId, tripId)
    if (userId !== dto.fromUser && userId !== dto.toUser) {
      throw new ForbiddenException('Можно отмечать только свои переводы')
    }
    if (dto.fromUser === dto.toUser) {
      throw new BadRequestException('Перевод самому себе невозможен')
    }
    if (!(dto.amount > 0)) {
      throw new BadRequestException('Сумма должна быть больше нуля')
    }
    await this.membership.assertMember(dto.fromUser, tripId)
    await this.membership.assertMember(dto.toUser, tripId)
    await this.settlements.save(
      this.settlements.create({
        tripId,
        fromUser: dto.fromUser,
        toUser: dto.toUser,
        amount: dto.amount.toFixed(2),
        status: 'settled',
      }),
    )
    return this.computeForTrip(userId, tripId)
  }
}
