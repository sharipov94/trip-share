import { QueryClient } from '@tanstack/react-query'
import { compressImage } from './image'
import { memories, type Memory } from '../api/memories'
import { bingo, type BingoState } from '../api/bingo'
import { session } from '../api/client'

export function uploadMemory(
  qc: QueryClient,
  tripId: string,
  file: File,
  phase?: string,
  takenAt?: string,
) {
  const tempId = 'tmp-' + Math.random().toString(36).slice(2)
  const localUrl = URL.createObjectURL(file)
  qc.setQueryData<Memory[]>(['memories', tripId], (old = []) => [
    { id: tempId, url: localUrl, author: '', phase: phase ?? null, takenAt: takenAt ?? null, userId: session.userId || 'me' },
    ...old,
  ])
  ;(async () => {
    try {
      const small = await compressImage(file)
      await memories.upload(tripId, small, { phase, takenAt })
      await qc.invalidateQueries({ queryKey: ['memories', tripId] })
    } catch {
      qc.setQueryData<Memory[]>(
        ['memories', tripId],
        (old = []) => old.filter((m) => m.id !== tempId),
      )
    }
  })()
}

/** Фоновая загрузка фото в клетку bingo с оптимистичным превью. */
export function uploadBingo(qc: QueryClient, tripId: string, key: string, file: File) {
  const localUrl = URL.createObjectURL(file)
  qc.setQueryData<BingoState>(['bingo', tripId], (old) => {
    if (!old) return old
    return {
      ...old,
      tasks: old.tasks.map((t) =>
        t.key === key ? { ...t, done: true, photoUrl: localUrl, uploading: true } : t,
      ),
      completed: old.tasks.filter((t) => t.done || t.key === key).length,
    }
  })
  ;(async () => {
    try {
      const small = await compressImage(file)
      const data = await bingo.uploadPhoto(tripId, key, small)
      qc.setQueryData(['bingo', tripId], data)
    } catch {
      qc.invalidateQueries({ queryKey: ['bingo', tripId] })
    }
  })()
}
