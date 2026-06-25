import { api, apiUpload, MOCK } from './client'
import { wait } from './_internal'
import * as mock from '../mocks/data'

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
