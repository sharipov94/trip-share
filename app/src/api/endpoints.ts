// Типизированные функции данных. В MOCK-режиме возвращают заглушки из ../data,
// в реальном — ходят в бэкенд и маппят его ответы во frontend-формы (drop-in).
import { api, apiUpload, MOCK, tokens, session } from './client'
import * as mock from '../data'
import type { Trip } from '../data'

const wait = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120))

// ── backend-формы (только то, что используем) ──
type BTrip = {
  id: string; title: string; description: string | null; status: Trip['status']
  baseCurrency: string; startDate: string | null; endDate: string | null
}
type BMember = { id: string; userId: string }
type BUser = { id: string; firstName: string | null; avatarUrl: string | null }
type BActivity = {
  id: string; title: string; description: string | null
  startTime: string | null; status: string
}
type BExpense = {
  id: string; title: string | null; amount: string; currency: string
  category: string | null; payerId: string
}
type BExpenseFull = BExpense & {
  tripId: string
  participants: { userId: string; amount: string; status: string }[]
}
type BBalance = { transfers: { from: string; to: string; amount: string }[] }

const CLS = ['g-a', 'g-c', 'g-b']
const clsFor = (id: string) => CLS[id.charCodeAt(0) % CLS.length]
const hhmm = (iso: string | null) => (iso ? new Date(iso).toTimeString().slice(0, 5) : '')
const partOf = (iso: string | null) => {
  const h = iso ? new Date(iso).getHours() : 12
  return h < 12 ? 'УТРО' : h < 18 ? 'ДЕНЬ' : 'ВЕЧЕР'
}

// кэш участников поездки: id → {имя, инициал, аватар}
type UserInfo = { name: string; initial: string; avatarUrl: string | null }
const userCache: Record<string, Record<string, UserInfo>> = {}
async function usersFor(tripId: string): Promise<Record<string, UserInfo>> {
  if (userCache[tripId]) return userCache[tripId]
  const members = await api<BMember[]>(`/trips/${tripId}/members`)
  const map: Record<string, UserInfo> = {}
  await Promise.all(
    members.map(async (m) => {
      const u = await api<BUser>(`/users/${m.userId}`).catch(() => null)
      const name = u?.firstName ?? 'Участник'
      map[m.userId] = { name, initial: name[0] ?? '?', avatarUrl: u?.avatarUrl ?? null }
    }),
  )
  userCache[tripId] = map
  return map
}
async function namesFor(tripId: string): Promise<Record<string, string>> {
  const u = await usersFor(tripId)
  const r: Record<string, string> = {}
  for (const k in u) r[k] = u[k].name
  return r
}
/** Сбросить кэш участников (после смены имени/аватара). */
export function clearUserCache() {
  for (const k in userCache) delete userCache[k]
}

export const auth = {
  async telegram(initData: string) {
    const r = await api<{ access: string; refresh: string; user: { id: string } }>(
      '/auth/telegram', { method: 'POST', body: { initData } },
    )
    tokens.set({ access: r.access, refresh: r.refresh })
    session.userId = r.user.id
    return r
  },
  async dev(firstName = 'Никита') {
    if (MOCK) return wait({ user: { id: 'me', firstName } })
    const r = await api<{ access: string; refresh: string; user: { id: string } }>(
      '/auth/dev', { method: 'POST', body: { firstName } },
    )
    tokens.set({ access: r.access, refresh: r.refresh })
    session.userId = r.user.id
    return r
  },
  async me() {
    if (MOCK) return wait({ id: 'me', firstName: 'Никита', avatarUrl: null, paymentDetails: null })
    const u = await api<{ id: string; firstName: string | null; avatarUrl: string | null; paymentDetails: string | null }>('/auth/me')
    session.userId = u.id
    return u
  },
  async updateTheme(theme: string) {
    if (MOCK) return wait({ ok: true })
    return api('/users/me', { method: 'PATCH', body: { theme } })
  },
  async updateProfile(body: { firstName?: string; paymentDetails?: string; avatarUrl?: string }) {
    if (MOCK) return wait({ ok: true })
    const r = await api('/users/me', { method: 'PATCH', body })
    clearUserCache() // имя/аватар могли измениться — сбросим кэш участников
    return r
  },
}

export const trips = {
  async list(): Promise<Trip[]> {
    if (MOCK) return wait(mock.tripList)
    const bs = await api<BTrip[]>('/trips')
    return bs.map((b) => ({
      id: b.id, title: b.title, dates: dateRange(b.startDate, b.endDate),
      status: b.status, cls: clsFor(b.id), day: b.status === 'finished' ? 1 : 0,
      totalDays: 1, stats: { km: 0, photos: 0 }, members: [],
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
      status: b.status, cls: clsFor(b.id), day: 0, totalDays: 1,
      stats: { km: 0, photos: 0 },
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
    const names = await namesFor(id)
    return b.transfers.map((t, i) => ({
      id: 'tr' + i,
      from: t.from === session.userId ? 'Ты' : names[t.from] ?? 'Участник',
      to: names[t.to] ?? 'Участник',
      toInitial: (names[t.to] ?? '?')[0],
      amount: Number(t.amount),
    }))
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
  async invite(id: string) {
    if (MOCK) return wait({ token: 'devtoken', deepLink: 'https://t.me/Share_trip_bot?startapp=devtoken' })
    return api<{ token: string; deepLink: string }>(`/trips/${id}/invite`, { method: 'POST' })
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
    const cur = s.baseCurrency === 'EUR' ? '€' : s.baseCurrency === 'USD' ? '$' : ''
    const slides = [
      { num: s.tripTitle, cap: 'Travel Wrapped', cls: 'g-a' },
      { num: String(s.days || s.activities), cap: s.days ? 'Дней вместе' : 'Активностей', cls: 'g-c' },
      { num: String(s.members), cap: 'Участников', cls: 'g-b' },
      { num: String(s.photos), cap: 'Фотографий', cls: 'g-a' },
      { num: String(s.activities), cap: 'Активностей', cls: 'g-c' },
      { num: cur + s.expensesTotal, cap: 'Общие расходы', cls: 'g-b' },
    ]
    return slides
  },
}

export const activities = {
  async list(tripId: string): Promise<typeof mock.activities> {
    if (MOCK) return wait(mock.activities)
    const bs = await api<BActivity[]>(`/trips/${tripId}/activities`)
    return bs.map((b) => ({
      id: b.id, title: b.title, time: hhmm(b.startTime), part: partOf(b.startTime),
      sub: b.description ?? '', status: b.status === 'confirmed' ? 'confirmed' : 'voting',
      going: 0, night: b.startTime ? new Date(b.startTime).getHours() >= 18 : false,
    }))
  },
  async vote(activityId: string, vote: 'going' | 'not_going') {
    if (MOCK) return wait({ ok: true })
    return api(`/activities/${activityId}/vote`, { method: 'POST', body: { vote } })
  },
  async get(id: string) {
    if (MOCK) {
      return wait({
        title: 'Музей Пикассо', sub: 'Carrer de Montcada, 15–23', time: '14:00',
        startTime: null as string | null, description: '' as string, price: null as number | null,
        going: mock.participants.filter((p) => p.vote === 'going').map((p) => ({ name: p.name, initial: p.initial, avatarUrl: null as string | null })),
      })
    }
    const a = await api<BActivity & { tripId: string; description: string | null; price: string | null; votes: { userId: string; vote: string }[] }>(`/activities/${id}`)
    const users = await usersFor(a.tripId)
    return {
      title: a.title, sub: a.description ?? '', time: hhmm(a.startTime),
      startTime: a.startTime, description: a.description ?? '', price: a.price != null ? Number(a.price) : null,
      going: a.votes.filter((v) => v.vote === 'going').map((v) => ({
        name: users[v.userId]?.name ?? 'Участник', initial: users[v.userId]?.initial ?? '?', avatarUrl: users[v.userId]?.avatarUrl ?? null,
      })),
    }
  },
  async update(id: string, body: { title?: string; description?: string; startTime?: string; price?: number }) {
    if (MOCK) return wait({ ok: true })
    return api(`/activities/${id}`, { method: 'PATCH', body })
  },
  async create(tripId: string, body: { title: string; startTime?: string; description?: string; activityUrl?: string; price?: number; currency?: string }) {
    if (MOCK) return wait({ ok: true })
    return api(`/trips/${tripId}/activities`, { method: 'POST', body })
  },
  async comments(activityId: string): Promise<{ id: string; author: string; initial: string; avatarUrl: string | null; body: string }[]> {
    if (MOCK) return wait(mock.comments.map((c) => ({ id: c.id, author: c.author, initial: c.initial, avatarUrl: null, body: c.text })))
    const cs = await api<{ id: string; userId: string | null; body: string; activityId: string }[]>(`/activities/${activityId}/comments`)
    if (!cs.length) return []
    const a = await api<{ tripId: string }>(`/activities/${activityId}`)
    const users = await usersFor(a.tripId)
    return cs.map((c) => ({
      id: c.id,
      author: c.userId ? users[c.userId]?.name ?? 'Участник' : 'Участник',
      initial: c.userId ? users[c.userId]?.initial ?? '?' : '?',
      avatarUrl: c.userId ? users[c.userId]?.avatarUrl ?? null : null,
      body: c.body,
    }))
  },
  async addComment(activityId: string, body: string) {
    if (MOCK) return wait({ ok: true })
    return api(`/activities/${activityId}/comments`, { method: 'POST', body: { body } })
  },
  async complete(activityId: string) {
    if (MOCK) return wait({ ok: true })
    return api(`/activities/${activityId}/complete`, { method: 'POST' })
  },
}

export const expenses = {
  async list(tripId: string): Promise<typeof mock.expenses> {
    if (MOCK) return wait(mock.expenses)
    const bs = await api<BExpense[]>(`/trips/${tripId}/expenses`)
    const names = await namesFor(tripId)
    return bs.map((b) => ({
      id: b.id, title: b.title ?? 'Расход', cat: b.category ?? 'Другое',
      payer: names[b.payerId] ?? 'Участник', amount: Number(b.amount), cur: '€',
    }))
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
      payer: names[e.payerId] ?? 'Участник', amount: Number(e.amount), cur: '€', tripId: e.tripId,
      participants: e.participants.map((p) => ({
        name: names[p.userId] ?? 'Участник', initial: (names[p.userId] ?? '?')[0],
        amount: Number(p.amount), isPayer: p.userId === e.payerId,
      })),
    }
  },
  async settle(expenseId: string) {
    if (MOCK) return wait({ ok: true })
    return api(`/expenses/${expenseId}/settle`, { method: 'POST' })
  },
}

type BMemory = { id: string; photoUrl: string; userId: string | null; activityId: string | null }

export const memories = {
  async list(tripId: string): Promise<{ id: string; url: string; author: string; cls?: string }[]> {
    if (MOCK) return wait(mock.moment.shots.map((s) => ({ id: s.id, url: '', author: s.author, cls: s.cls })))
    const ms = await api<BMemory[]>(`/trips/${tripId}/memories`)
    const names = await namesFor(tripId)
    return ms.map((m) => ({ id: m.id, url: m.photoUrl, author: m.userId ? names[m.userId] ?? '' : '' }))
  },
  async upload(tripId: string, file: File, opts: { phase?: string; activityId?: string } = {}) {
    if (MOCK) return wait({ ok: true })
    const form = new FormData()
    form.append('photo', file)
    if (opts.phase) form.append('phase', opts.phase)
    if (opts.activityId) form.append('activityId', opts.activityId)
    return apiUpload(`/trips/${tripId}/memories`, form)
  },
}

export type BingoTask = { key: string; text: string; done: boolean; photoUrl: string | null; uploading?: boolean }
export type BingoState = { tasks: BingoTask[]; completed: number; total: number }

export const bingo = {
  async list(tripId: string): Promise<BingoState> {
    if (MOCK) return wait({ tasks: mock.bingo.map((b) => ({ key: b.id, text: b.text, done: b.done, photoUrl: null })), completed: mock.bingo.filter((b) => b.done).length, total: mock.bingo.length })
    return api<BingoState>(`/trips/${tripId}/bingo`)
  },
  async uploadPhoto(tripId: string, key: string, file: File): Promise<BingoState> {
    if (MOCK) return wait({ tasks: [], completed: 0, total: 0 })
    const form = new FormData()
    form.append('photo', file)
    return apiUpload<BingoState>(`/trips/${tripId}/bingo/${key}/photo`, form)
  },
  async remove(tripId: string, key: string): Promise<BingoState> {
    if (MOCK) return wait({ tasks: [], completed: 0, total: 0 })
    return api<BingoState>(`/trips/${tripId}/bingo/${key}`, { method: 'DELETE' })
  },
}

export const receipts = {
  async ocr(tripId: string, file: File): Promise<{ rawText: string; items: { name: string; price: number }[]; total: number }> {
    if (MOCK) {
      return wait({
        rawText: '', total: mock.receiptItems.reduce((s, r) => s + r.price, 0),
        items: mock.receiptItems.map((r) => ({ name: r.name, price: r.price })),
      })
    }
    const form = new FormData()
    form.append('photo', file)
    return apiUpload(`/trips/${tripId}/receipt-ocr`, form)
  },
}

function dateRange(a: string | null, b: string | null): string {
  if (!a) return ''
  const f = (d: string) => new Date(d).toLocaleDateString('ru', { day: 'numeric', month: 'short' })
  return b ? `${f(a)} – ${f(b)}` : f(a)
}
