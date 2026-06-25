// Общая инфраструктура api-слоя: задержка для MOCK, кэш участников поездки,
// и backend-формы, которые нужны больше чем одному домену.
import { api } from './client'

/** Имитация сетевой задержки в MOCK-режиме. */
export const wait = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120))

// ── backend-формы, общие для нескольких доменов ──
export type BMember = { id: string; userId: string }
export type BUser = { id: string; firstName: string | null; avatarUrl: string | null }

// кэш участников поездки: id → {имя, инициал, аватар}
type UserInfo = { name: string; initial: string; avatarUrl: string | null }
const userCache: Record<string, Record<string, UserInfo>> = {}

export async function usersFor(tripId: string): Promise<Record<string, UserInfo>> {
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

export async function namesFor(tripId: string): Promise<Record<string, string>> {
  const u = await usersFor(tripId)
  const r: Record<string, string> = {}
  for (const k in u) r[k] = u[k].name
  return r
}

/** Сбросить кэш участников (после смены имени/аватара). */
export function clearUserCache() {
  for (const k in userCache) delete userCache[k]
}
