import { api, apiUpload, MOCK, session } from './client'
import { wait, usersFor, type BMember } from './_internal'
import { currencySymbol } from '../lib/currency'
import * as mock from '../mocks/data'
import type { Trip } from '../types'

type BTrip = {
  id: string; title: string; description: string | null; status: Trip['status']
  baseCurrency: string; startDate: string | null; endDate: string | null
  coverUrl?: string | null
}
type BBalance = { transfers: { from: string; to: string; amount: string }[] }

const CLS = ['g-a', 'g-c', 'g-b']
const clsFor = (id: string) => CLS[id.charCodeAt(0) % CLS.length]

function dateRange(a: string | null, b: string | null): string {
  if (!a) return ''
  const f = (d: string) => new Date(d).toLocaleDateString('ru', { day: 'numeric', month: 'short' })
  return b ? `${f(a)} – ${f(b)}` : f(a)
}

export const trips = {
  async list(): Promise<Trip[]> {
    if (MOCK) return wait(mock.tripList)
    const bs = await api<BTrip[]>('/trips')
    return bs.map((b) => ({
      id: b.id, title: b.title, dates: dateRange(b.startDate, b.endDate),
      status: b.status, cls: clsFor(b.id), currency: currencySymbol(b.baseCurrency),
      coverUrl: b.coverUrl ?? null, members: [],
    }))
  },
  async get(id: string): Promise<Trip> {
    if (MOCK) return wait(mock.getTrip(id))
    const b = await api<BTrip>(`/trips/${id}`)
    const members = await api<BMember[]>(`/trips/${id}/members`)
    const users = await usersFor(id)
    return {
      id: b.id, title: b.title, dates: dateRange(b.startDate, b.endDate),
      startDate: b.startDate, endDate: b.endDate,
      status: b.status, cls: clsFor(b.id), currency: currencySymbol(b.baseCurrency),
      coverUrl: b.coverUrl ?? null,
      members: members.map((m) => ({
        id: m.userId,
        name: users[m.userId]?.name ?? 'Участник',
        initial: users[m.userId]?.initial ?? '?',
        avatarUrl: users[m.userId]?.avatarUrl ?? null,
      })),
    }
  },
  async balance(id: string) {
    if (MOCK) return wait(mock.settlements)
    const b = await api<BBalance>(`/trips/${id}/balance`)
    const users = await usersFor(id)
    return b.transfers.map((t, i) => ({
      id: 'tr' + i,
      fromId: t.from,
      toId: t.to,
      toUsername: users[t.to]?.username ?? null,
      from: t.from === session.userId ? 'Ты' : users[t.from]?.name ?? 'Участник',
      to: t.to === session.userId ? 'Ты' : users[t.to]?.name ?? 'Участник',
      toInitial: users[t.to]?.initial ?? '?',
      amount: Number(t.amount),
    }))
  },
  /** Зафиксировать наличный перевод (отметить долг оплаченным). */
  async recordSettlement(id: string, body: { fromUser: string; toUser: string; amount: number }) {
    if (MOCK) return wait({ ok: true })
    return api(`/trips/${id}/settlements`, { method: 'POST', body })
  },
  async create(body: { title: string; baseCurrency: string; tripType?: string; startDate?: string; endDate?: string }) {
    if (MOCK) return wait({ id: mock.trip.id })
    const b = await api<BTrip>('/trips', { method: 'POST', body })
    return { id: b.id }
  },
  async update(id: string, body: { title?: string; status?: string; startDate?: string; endDate?: string; tripType?: string }) {
    if (MOCK) return wait({ ok: true })
    return api(`/trips/${id}`, { method: 'PATCH', body })
  },
  /** Загрузить/сменить обложку поездки. */
  async uploadCover(id: string, file: File) {
    if (MOCK) return wait({ coverUrl: URL.createObjectURL(file) })
    const form = new FormData()
    form.append('photo', file)
    return apiUpload<{ coverUrl: string }>(`/trips/${id}/cover`, form)
  },
  async invite(id: string) {
    if (MOCK) return wait({ token: 'devtoken', deepLink: 'https://t.me/Share_trip_bot?startapp=devtoken' })
    return api<{ token: string; deepLink: string }>(`/trips/${id}/invite`, { method: 'POST' })
  },
  async remove(id: string) {
    if (MOCK) return wait({ ok: true })
    return api(`/trips/${id}`, { method: 'DELETE' })
  },
  async join(token: string): Promise<{ id: string }> {
    if (MOCK) return wait({ id: mock.trip.id })
    const b = await api<BTrip>('/trips/join', { method: 'POST', body: { token } })
    return { id: b.id }
  },
  async summary(id: string): Promise<{ num: string; cap: string; cls: string }[]> {
    if (MOCK) return wait(mock.wrapped)
    const s = await api<{
      tripTitle: string; days: number; members: number; activities: number
      photos: number; expenses: number; expensesTotal: string; baseCurrency: string
    }>(`/trips/${id}/summary`)
    const cur = currencySymbol(s.baseCurrency)
    return [
      { num: s.tripTitle, cap: 'Travel Wrapped', cls: 'g-a' },
      { num: String(s.days || s.activities), cap: s.days ? 'Дней вместе' : 'Активностей', cls: 'g-c' },
      { num: String(s.members), cap: 'Участников', cls: 'g-b' },
      { num: String(s.photos), cap: 'Фотографий', cls: 'g-a' },
      { num: String(s.activities), cap: 'Активностей', cls: 'g-c' },
      { num: cur + s.expensesTotal, cap: 'Общие расходы', cls: 'g-b' },
    ]
  },
}
