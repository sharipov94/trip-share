import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { Expense } from '../entities/expense.entity'
import { ExpenseParticipant } from '../entities/expense-participant.entity'
import { MembershipService } from '../common/membership.service'
import { fromCents, minimizeTransfers, toCents } from '../common/money'

@Injectable()
export class BalanceService {
  constructor(
    @InjectRepository(Expense) private readonly expenses: Repository<Expense>,
    @InjectRepository(ExpenseParticipant) private readonly parts: Repository<ExpenseParticipant>,
    private readonly membership: MembershipService,
  ) {}

  async computeForTrip(userId: string, tripId: string) {
    await this.membership.assertMember(userId, tripId)

    const expenses = await this.expenses.find({ where: { tripId } })
    const expenseIds = expenses.map((e) => e.id)
    const parts = expenseIds.length
      ? await this.parts.find({ where: { expenseId: In(expenseIds) } })
      : []

    // net = оплачено - доля (только pending). В центах.
    const net: Record<string, number> = {}
    const add = (uid: string, c: number) => (net[uid] = (net[uid] ?? 0) + c)

    for (const e of expenses) add(e.payerId, toCents(e.amount))
    for (const p of parts) {
      if (p.status === 'pending') add(p.userId, -toCents(p.amount))
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
}
