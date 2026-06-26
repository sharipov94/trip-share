import type { Memory } from '../api/memories'

export type SlotStatus = 'done' | 'open' | 'locked'
export type SlotKind = 'before_trip' | 'during_trip' | 'after_trip'

export type Slot = {
  key: string          // 'before_trip' | 'day_1' | 'day_2' | ... | 'after_trip'
  label: string        // 'До' | 'Д1' | 'Д2' | ... | 'После'
  kind: SlotKind
  slotDate: Date       // дата открытия слота (для locked/open)
  dayIndex?: number    // 1-based, только для during_trip
}

/** Строит массив слотов по startDate/endDate поездки (ISO-строки). */
export function buildSlots(startDate: string, endDate: string): Slot[] {
  const start = new Date(startDate)
  const end   = new Date(endDate)
  const slots: Slot[] = []

  slots.push({ key: 'before_trip', label: 'До', kind: 'before_trip', slotDate: start })

  const msPerDay = 86_400_000
  const days = Math.round((end.getTime() - start.getTime()) / msPerDay) + 1
  for (let d = 0; d < days; d++) {
    const date = new Date(start.getTime() + d * msPerDay)
    slots.push({
      key: `day_${d + 1}`,
      label: `Д${d + 1}`,
      kind: 'during_trip',
      slotDate: date,
      dayIndex: d + 1,
    })
  }

  // after_trip opens day after endDate
  const afterDate = new Date(end.getTime() + msPerDay)
  slots.push({ key: 'after_trip', label: 'После', kind: 'after_trip', slotDate: afterDate })

  return slots
}

/**
 * Статус слота для текущего пользователя.
 * today по умолчанию = new Date() — параметр нужен только для тестов.
 */
export function slotStatus(
  slot: Slot,
  photos: Memory[],
  myUserId: string,
  today: Date = new Date(),
): SlotStatus {
  const slotDay = new Date(slot.slotDate)
  slotDay.setHours(0, 0, 0, 0)
  const todayDay = new Date(today)
  todayDay.setHours(0, 0, 0, 0)

  if (slotDay > todayDay) return 'locked'

  const startDate = _slotStart(slot)
  const hasMyPhoto = photos.some(
    (p) => p.userId === myUserId && slotKeyFromPhoto(p.phase, p.takenAt, startDate) === slot.key,
  )
  return hasMyPhoto ? 'done' : 'open'
}

/** Возвращает { phase, takenAt } для передачи в uploadMemory при загрузке фото в слот. */
export function slotKeyForUpload(slot: Slot): { phase: string; takenAt: string } {
  const noon = new Date(slot.slotDate)
  noon.setHours(12, 0, 0, 0)
  return { phase: slot.kind, takenAt: noon.toISOString() }
}

/**
 * Из полей `phase` и `takenAt` фото вычисляет ключ слота.
 * startDate — ISO-строка начала поездки.
 */
export function slotKeyFromPhoto(
  phase: string | null,
  takenAt: string | null,
  startDate: string,
): string {
  if (phase === 'before_trip') return 'before_trip'
  if (phase === 'after_trip') return 'after_trip'
  if (phase === 'during_trip' && takenAt) {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const taken = new Date(takenAt)
    taken.setHours(0, 0, 0, 0)
    const day = Math.round((taken.getTime() - start.getTime()) / 86_400_000) + 1
    return `day_${day}`
  }
  return 'unknown'
}

// внутренняя хелпер — вытащить startDate из слота для slotStatus
function _slotStart(slot: Slot): string {
  if (slot.kind === 'before_trip' || slot.kind === 'after_trip') {
    return slot.slotDate.toISOString().slice(0, 10)
  }
  // day_N: startDate = slotDate - (dayIndex-1) days
  const d = new Date(slot.slotDate.getTime() - ((slot.dayIndex ?? 1) - 1) * 86_400_000)
  return d.toISOString().slice(0, 10)
}
