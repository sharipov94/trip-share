import { api, MOCK } from './client'
import { wait, namesFor } from './_internal'
import { currencySymbol } from '../lib/currency'
import * as mock from '../mocks/data'

type BExpense = {
  id: string; title: string | null; amount: string; currency: string
  category: string | null; payerId: string
}
type BExpenseFull = BExpense & {
  tripId: string
  participants: { userId: string; amount: string; status: string }[]
}

export const expenses = {
  async list(tripId: string): Promise<typeof mock.expenses> {
    if (MOCK) return wait(mock.expenses)
    const bs = await api<BExpense[]>(`/trips/${tripId}/expenses`)
    const names = await namesFor(tripId)
    return bs.map((b) => ({
      id: b.id, title: b.title ?? 'Расход', cat: b.category ?? 'Другое',
      payer: names[b.payerId] ?? 'Участник', amount: Number(b.amount), cur: currencySymbol(b.currency),
    }))
  },
  /** Все расходы по всем поездкам пользователя (агрегация на фронте). */
  async all(trips: { id: string; title: string }[]) {
    const per = await Promise.all(
      trips.map(async (t) => (await expenses.list(t.id)).map((e) => ({ ...e, tripId: t.id, tripTitle: t.title }))),
    )
    return per.flat()
  },
  async create(tripId: string, body: { amount: number; currency: string; category?: string; title?: string }) {
    if (MOCK) return wait({ ok: true })
    return api(`/trips/${tripId}/expenses`, {
      method: 'POST', body,
      headers: { 'idempotency-key': crypto.randomUUID() },
    })
  },
  async get(expenseId: string) {
    if (MOCK) {
      return wait({
        id: expenseId, title: 'Обед · La Boqueria', cat: 'Ресторан', payer: 'Аня',
        amount: 84, cur: '€', tripId: mock.trip.id,
        participants: mock.participants.map((p) => ({ name: p.name, initial: p.initial, amount: 16.8, isPayer: p.name === 'Аня' })),
      })
    }
    const e = await api<BExpenseFull>(`/expenses/${expenseId}`)
    const names = await namesFor(e.tripId)
    return {
      id: e.id, title: e.title ?? 'Расход', cat: e.category ?? 'Другое',
      payer: names[e.payerId] ?? 'Участник', amount: Number(e.amount), cur: currencySymbol(e.currency), tripId: e.tripId,
      participants: e.participants.map((p) => ({
        name: names[p.userId] ?? 'Участник', initial: (names[p.userId] ?? '?')[0],
        amount: Number(p.amount), isPayer: p.userId === e.payerId,
      })),
    }
  },
}
