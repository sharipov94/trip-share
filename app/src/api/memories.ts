import { api, apiUpload, MOCK } from './client'
import { wait, namesFor } from './_internal'
import * as mock from '../mocks/data'

type BMemory = {
  id: string
  photoUrl: string
  userId: string | null
  activityId: string | null
  memoryPhase: string | null
  takenAt: string | null
}

export type Memory = {
  id: string
  url: string
  author: string
  phase: string | null
  takenAt: string | null
  userId: string | null
}

export const memories = {
  async list(tripId: string): Promise<Memory[]> {
    if (MOCK) return wait(mock.calendarPhotos)
    const ms = await api<BMemory[]>(`/trips/${tripId}/memories`)
    const names = await namesFor(tripId)
    return ms.map((m) => ({
      id: m.id,
      url: m.photoUrl,
      author: m.userId ? names[m.userId] ?? '' : '',
      phase: m.memoryPhase,
      takenAt: m.takenAt,
      userId: m.userId,
    }))
  },
  async upload(
    tripId: string,
    file: File,
    opts: { phase?: string; activityId?: string; takenAt?: string } = {},
  ) {
    if (MOCK) return wait({ ok: true })
    const form = new FormData()
    form.append('photo', file)
    if (opts.phase) form.append('phase', opts.phase)
    if (opts.activityId) form.append('activityId', opts.activityId)
    if (opts.takenAt) form.append('takenAt', opts.takenAt)
    return apiUpload(`/trips/${tripId}/memories`, form)
  },
}
