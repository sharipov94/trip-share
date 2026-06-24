import { QueryClient } from '@tanstack/react-query'
import { compressImage } from './image'
import { memories, bingo } from '../api/endpoints'

type Photo = { id: string; url: string; author: string; uploading?: boolean }

/**
 * Фоновая загрузка фото-воспоминания: сразу показываем локальное превью
 * (оптимистично), загрузка идёт в фоне — экран можно покинуть, фото не потеряется.
 */
export function uploadMemory(qc: QueryClient, tripId: string, file: File, phase?: string) {
  const tempId = 'tmp-' + Math.random().toString(36).slice(2)
  const localUrl = URL.createObjectURL(file)
  qc.setQueryData<Photo[]>(['memories', tripId], (old = []) => [
    { id: tempId, url: localUrl, author: '', uploading: true },
    ...old,
  ])
  ;(async () => {
    try {
      const small = await compressImage(file)
      await memories.upload(tripId, small, { phase })
      await qc.invalidateQueries({ queryKey: ['memories', tripId] })
    } catch {
      qc.setQueryData<Photo[]>(['memories', tripId], (old = []) => old.filter((m) => m.id !== tempId))
    }
  })()
}

/** Фоновая загрузка фото в клетку bingo с оптимистичным превью. */
export function uploadBingo(qc: QueryClient, tripId: string, key: string, file: File) {
  const localUrl = URL.createObjectURL(file)
  qc.setQueryData<any>(['bingo', tripId], (old: any) => {
    if (!old) return old
    return {
      ...old,
      tasks: old.tasks.map((t: any) => (t.key === key ? { ...t, done: true, photoUrl: localUrl, uploading: true } : t)),
      completed: old.tasks.filter((t: any) => t.done || t.key === key).length,
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
