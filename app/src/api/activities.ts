import { api, MOCK } from './client'
import { wait, usersFor } from './_internal'
import * as mock from '../mocks/data'

type BActivity = {
  id: string; title: string; description: string | null
  startTime: string | null; status: string; goingCount?: number
}

const hhmm = (iso: string | null) => (iso ? new Date(iso).toTimeString().slice(0, 5) : '')
const partOf = (iso: string | null) => {
  const h = iso ? new Date(iso).getHours() : 12
  return h < 12 ? 'УТРО' : h < 18 ? 'ДЕНЬ' : 'ВЕЧЕР'
}

export const activities = {
  async list(tripId: string): Promise<typeof mock.activities> {
    if (MOCK) return wait(mock.activities)
    const bs = await api<BActivity[]>(`/trips/${tripId}/activities`)
    return bs.map((b) => ({
      id: b.id, title: b.title, time: hhmm(b.startTime), part: partOf(b.startTime),
      sub: b.description ?? '', status: b.status === 'confirmed' ? 'confirmed' : 'voting',
      going: b.goingCount ?? 0, night: b.startTime ? new Date(b.startTime).getHours() >= 18 : false,
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
