import { api, apiUpload, MOCK } from './client'
import { wait, namesFor } from './_internal'
import * as mock from '../mocks/data'

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
