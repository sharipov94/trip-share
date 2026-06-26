# Photo Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat photo feed in the trip Photos tab with a time-gated personal slot calendar (До · День 1…N · После) where each slot shows ✓ / 📷 / ○ based on upload status and trip timeline.

**Architecture:** Утилита `lib/photoSlots.ts` вычисляет слоты и статусы из дат поездки и массива фото. Компонент `PhotoCalendar.tsx` рендерит горизонтальную ленту и карточку слота. `TripPhotos.tsx` заменяет сегмент «Лента» на «Календарь». Бэкенд-entity дополняется `during_trip`; фронт-маппинг `memories.ts` начинает прокидывать `phase` и `takenAt`.

**Tech Stack:** React 18, TypeScript, react-router v6, @tanstack/react-query v5, vitest + @testing-library/react, existing CSS utility classes (`.seg`, `.shot`, `.btn-grad`, `.btn-ghost`, `.row-item`, `.sub`, `.lbl`).

## Global Constraints

- Все строки UI на русском языке
- Компонент должен работать в MOCK-режиме (`MOCK = true` при `VITE_API_URL=""`)
- `DB_SYNCHRONIZE=false` на проде — новые колонки/значения только через `ALTER TABLE` (здесь не нужно, varchar)
- `session.userId` из `app/src/api/client.ts` — источник id текущего пользователя
- Существующие тесты должны проходить без изменений (`npm run test` в `app/`)
- Частые коммиты после каждой задачи

---

## File Map

| Файл | Действие | Ответственность |
|---|---|---|
| `server/src/entities/memory.entity.ts` | Modify | добавить `during_trip` в `MemoryPhase` |
| `app/src/api/memories.ts` | Modify | `BMemory` + `phase`/`takenAt` в маппинге |
| `app/src/lib/uploads.ts` | Modify | `uploadMemory` принимает `takenAt?: string` |
| `app/src/lib/photoSlots.ts` | Create | утилиты: `buildSlots`, `slotStatus`, `slotKey` |
| `app/src/lib/photoSlots.test.ts` | Create | тесты утилит |
| `app/src/mocks/data.ts` | Modify | mock-фото с `phase` + `takenAt` |
| `app/src/screens/trip/PhotoCalendar.tsx` | Create | компонент: лента слотов + карточка |
| `app/src/screens/trip/TripPhotos.tsx` | Modify | сегмент «Лента» → «Календарь», вызов PhotoCalendar |
| `app/src/screens/trip/TripPhotos.test.tsx` | Modify | обновить тест под новый сегмент «Календарь» |
| `app/src/screens/PhotoUpload.tsx` | Modify | убрать пикер фаз; принять `slot` из location state |

---

## Task 1: `during_trip` в MemoryPhase + маппинг на фронте

**Files:**
- Modify: `server/src/entities/memory.entity.ts`
- Modify: `app/src/api/memories.ts`

**Interfaces:**
- Produces: `memories.list()` возвращает `{ id: string; url: string; author: string; phase: string | null; takenAt: string | null; userId: string | null }[]`
- Produces: `memories.upload()` принимает `opts.takenAt?: string`

- [ ] **Step 1: Добавить `during_trip` в entity**

В `server/src/entities/memory.entity.ts` замени тип:

```ts
export type MemoryPhase =
  | 'before_activity' | 'during_activity' | 'after_activity'
  | 'before_trip' | 'during_trip' | 'after_trip'
```

- [ ] **Step 2: Расширить `BMemory` и маппинг на фронте**

В `app/src/api/memories.ts` замени файл целиком:

```ts
import { api, apiUpload, MOCK, session } from './client'
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
      author: m.userId ? names[m.userId]?.name ?? '' : '',
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
```

- [ ] **Step 3: Добавить mock-данные `calendarPhotos` в `mocks/data.ts`**

В конец `app/src/mocks/data.ts` добавь:

```ts
// Mock-фото для календаря. tripList[0] = bcn-2027 (active, startDate = 2027-06-12).
// takenAt noon UTC по дням поездки.
export const calendarPhotos: import('../api/memories').Memory[] = [
  { id: 'cp1', url: '', author: 'Ты', phase: 'before_trip',  takenAt: '2027-06-10T12:00:00Z', userId: 'me' },
  { id: 'cp2', url: '', author: 'Ты', phase: 'during_trip',  takenAt: '2027-06-12T12:00:00Z', userId: 'me' },
  { id: 'cp3', url: '', author: 'Аня', phase: 'during_trip', takenAt: '2027-06-13T12:00:00Z', userId: 'u1' },
]
```

- [ ] **Step 4: Обновить `uploads.ts` — добавить `takenAt`**

В `app/src/lib/uploads.ts` замени сигнатуру и тело `uploadMemory`:

```ts
import { QueryClient } from '@tanstack/react-query'
import { compressImage } from './image'
import { memories, type Memory } from '../api/memories'
import { bingo, type BingoState } from '../api/bingo'

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
    { id: tempId, url: localUrl, author: '', phase: phase ?? null, takenAt: takenAt ?? null, userId: null },
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
```

- [ ] **Step 5: Проверить что tsc проходит**

```bash
cd app && npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 6: Прогнать тесты**

```bash
cd app && npx vitest run
```
Expected: все тесты green.

- [ ] **Step 7: Коммит**

```bash
git add server/src/entities/memory.entity.ts app/src/api/memories.ts app/src/lib/uploads.ts app/src/mocks/data.ts
git commit -m "feat(photos): add during_trip phase; memories.list returns phase+takenAt"
```

---

## Task 2: Утилита `lib/photoSlots.ts`

**Files:**
- Create: `app/src/lib/photoSlots.ts`
- Create: `app/src/lib/photoSlots.test.ts`

**Interfaces:**
- Consumes: `Memory` из `app/src/api/memories.ts` — `{ phase: string|null; takenAt: string|null; userId: string|null }`
- Produces:
  ```ts
  type SlotStatus = 'done' | 'open' | 'locked'
  type Slot = { key: string; label: string; kind: 'before_trip'|'during_trip'|'after_trip'; slotDate: Date; dayIndex?: number }
  function buildSlots(startDate: string, endDate: string): Slot[]
  function slotStatus(slot: Slot, photos: Memory[], myUserId: string, today?: Date): SlotStatus
  function slotKeyForUpload(slot: Slot): { phase: string; takenAt: string }
  function slotKeyFromPhoto(phase: string|null, takenAt: string|null, startDate: string): string
  ```

- [ ] **Step 1: Написать failing тесты**

Создай `app/src/lib/photoSlots.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildSlots, slotStatus, slotKeyForUpload, slotKeyFromPhoto } from './photoSlots'
import type { Memory } from '../api/memories'

const START = '2027-06-12'
const END   = '2027-06-14'  // 3 дня: 12, 13, 14

describe('buildSlots', () => {
  it('returns before_trip + 3 days + after_trip', () => {
    const slots = buildSlots(START, END)
    expect(slots.map((s) => s.key)).toEqual([
      'before_trip', 'day_1', 'day_2', 'day_3', 'after_trip',
    ])
  })

  it('day slots have correct labels', () => {
    const slots = buildSlots(START, END)
    expect(slots[1].label).toBe('Д1')
    expect(slots[3].label).toBe('Д3')
  })

  it('before_trip label is До', () => {
    expect(buildSlots(START, END)[0].label).toBe('До')
  })

  it('after_trip label is После', () => {
    const slots = buildSlots(START, END)
    expect(slots[slots.length - 1].label).toBe('После')
  })
})

describe('slotStatus', () => {
  const slots = buildSlots(START, END)
  const beforeSlot = slots[0]   // before_trip
  const day1Slot   = slots[1]   // day_1 = 2027-06-12
  const day2Slot   = slots[2]   // day_2 = 2027-06-13

  const myPhoto: Memory = {
    id: 'p1', url: '', author: 'Me', phase: 'before_trip', takenAt: '2027-06-10T12:00:00Z', userId: 'me',
  }
  const otherPhoto: Memory = {
    id: 'p2', url: '', author: 'Аня', phase: 'during_trip', takenAt: '2027-06-12T12:00:00Z', userId: 'other',
  }

  it('locked when slot date is in the future', () => {
    const past = new Date('2026-01-01')
    expect(slotStatus(beforeSlot, [], 'me', past)).toBe('locked')
  })

  it('open when slot is due and no photo from me', () => {
    const future = new Date('2028-01-01')
    expect(slotStatus(beforeSlot, [], 'me', future)).toBe('open')
  })

  it('done when I have a photo for this slot', () => {
    const future = new Date('2028-01-01')
    expect(slotStatus(beforeSlot, [myPhoto], 'me', future)).toBe('done')
  })

  it('open (not done) when only others have a photo', () => {
    const future = new Date('2028-01-01')
    expect(slotStatus(day1Slot, [otherPhoto], 'me', future)).toBe('open')
  })
})

describe('slotKeyForUpload', () => {
  it('before_trip returns correct phase and midnight date', () => {
    const slots = buildSlots(START, END)
    const r = slotKeyForUpload(slots[0])
    expect(r.phase).toBe('before_trip')
    expect(r.takenAt).toContain('2027-06-12')
  })

  it('day_2 returns during_trip and day 2 date', () => {
    const slots = buildSlots(START, END)
    const r = slotKeyForUpload(slots[2])
    expect(r.phase).toBe('during_trip')
    expect(r.takenAt).toContain('2027-06-13')
  })
})

describe('slotKeyFromPhoto', () => {
  it('maps before_trip phase to before_trip key', () => {
    expect(slotKeyFromPhoto('before_trip', null, START)).toBe('before_trip')
  })

  it('maps during_trip + day 1 date to day_1', () => {
    expect(slotKeyFromPhoto('during_trip', '2027-06-12T12:00:00Z', START)).toBe('day_1')
  })

  it('maps during_trip + day 2 date to day_2', () => {
    expect(slotKeyFromPhoto('during_trip', '2027-06-13T06:00:00Z', START)).toBe('day_2')
  })

  it('maps after_trip phase to after_trip key', () => {
    expect(slotKeyFromPhoto('after_trip', null, START)).toBe('after_trip')
  })
})
```

- [ ] **Step 2: Запустить тесты — убедиться что падают**

```bash
cd app && npx vitest run src/lib/photoSlots.test.ts
```
Expected: FAIL — `Cannot find module './photoSlots'`

- [ ] **Step 3: Написать реализацию**

Создай `app/src/lib/photoSlots.ts`:

```ts
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

  const myKey = slotKeyFromPhotoInternal(slot)
  const hasMyPhoto = photos.some(
    (p) => p.userId === myUserId && slotKeyFromPhoto(p.phase, p.takenAt, _slotStart(slot)) === slot.key,
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

// используется только внутри slotStatus — не нужен вовне
function slotKeyFromPhotoInternal(_slot: Slot): string { return '' }
```

> Примечание: `slotStatus` вызывает `slotKeyFromPhoto` с `_slotStart(slot)`. Это работает потому что `slotKeyFromPhoto` для `before_trip`/`after_trip` игнорирует `startDate`.

- [ ] **Step 4: Запустить тесты — убедиться что проходят**

```bash
cd app && npx vitest run src/lib/photoSlots.test.ts
```
Expected: все 11 тестов green.

- [ ] **Step 5: Полный прогон тестов**

```bash
cd app && npx vitest run
```
Expected: все тесты green.

- [ ] **Step 6: Коммит**

```bash
git add app/src/lib/photoSlots.ts app/src/lib/photoSlots.test.ts
git commit -m "feat(photos): photoSlots utility — buildSlots, slotStatus, slotKeyFromPhoto"
```

---

## Task 3: Компонент `PhotoCalendar.tsx`

**Files:**
- Create: `app/src/screens/trip/PhotoCalendar.tsx`

**Interfaces:**
- Consumes:
  - `buildSlots(startDate, endDate): Slot[]` из `lib/photoSlots`
  - `slotStatus(slot, photos, myUserId, today): SlotStatus` из `lib/photoSlots`
  - `slotKeyForUpload(slot): { phase, takenAt }` из `lib/photoSlots`
  - `slotKeyFromPhoto(phase, takenAt, startDate): string` из `lib/photoSlots`
  - `Memory` из `api/memories`
  - `useTrip`, `useMemories` из `api/queries`
  - `session` из `api/client`
  - `uploadMemory` из `lib/uploads`
  - `useQueryClient` из `@tanstack/react-query`
- Props: `interface PhotoCalendarProps { tripId: string }`

- [ ] **Step 1: Создать компонент**

Создай `app/src/screens/trip/PhotoCalendar.tsx`:

```tsx
import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTrip, useMemories } from '../../api/queries'
import { session } from '../../api/client'
import { buildSlots, slotStatus, slotKeyForUpload, slotKeyFromPhoto, type Slot } from '../../lib/photoSlots'
import { uploadMemory } from '../../lib/uploads'
import { tg } from '../../lib/tg'

interface PhotoCalendarProps { tripId: string }

const STATUS_ICON: Record<string, string> = { done: '✓', open: '📷', locked: '○' }

export default function PhotoCalendar({ tripId }: PhotoCalendarProps) {
  const qc = useQueryClient()
  const { data: trip } = useTrip(tripId)
  const { data: photos = [] } = useMemories(tripId)
  const [selected, setSelected] = useState<Slot | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingSlot, setPendingSlot] = useState<Slot | null>(null)

  if (!trip?.startDate || !trip?.endDate) {
    return <p className="sub" style={{ textAlign: 'center', padding: '40px 0' }}>Укажи даты поездки, чтобы увидеть календарь</p>
  }

  const slots = buildSlots(trip.startDate, trip.endDate)
  const myId = session.userId || 'me'
  const startDate = trip.startDate

  const onSlotTap = (slot: Slot) => {
    const st = slotStatus(slot, photos, myId)
    if (st === 'locked') return
    if (st === 'done') { setSelected(slot); return }
    // open → камера
    setPendingSlot(slot)
    tg.haptic('light')
    inputRef.current?.click()
  }

  const onFilePick = (f: File | undefined) => {
    if (!f || !pendingSlot) return
    const { phase, takenAt } = slotKeyForUpload(pendingSlot)
    uploadMemory(qc, tripId, f, phase, takenAt)
    setPendingSlot(null)
  }

  // Фото выбранного слота (только мои)
  const slotPhotos = selected
    ? photos.filter(
        (p) => p.userId === myId && slotKeyFromPhoto(p.phase, p.takenAt, startDate) === selected.key,
      )
    : []

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => onFilePick(e.target.files?.[0])}
      />

      {/* горизонтальная лента */}
      <div style={{
        display: 'flex', overflowX: 'auto', gap: 10, padding: '4px 2px 12px',
        scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
      }}>
        {slots.map((slot) => {
          const st = slotStatus(slot, photos, myId)
          return (
            <div
              key={slot.key}
              onClick={() => onSlotTap(slot)}
              style={{
                flexShrink: 0, scrollSnapAlign: 'center',
                width: 64, borderRadius: 16,
                background: st === 'done' ? 'var(--g1)' : 'var(--card)',
                border: '1px solid var(--line)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '10px 0 8px',
                cursor: st === 'locked' ? 'default' : 'pointer',
                opacity: st === 'locked' ? 0.4 : 1,
              }}
            >
              <span className="lbl" style={{ fontSize: 10, color: st === 'done' ? 'var(--on-grad)' : undefined }}>
                {slot.label}
              </span>
              <span style={{ fontSize: 20, marginTop: 6, color: st === 'done' ? 'var(--on-grad)' : undefined }}>
                {STATUS_ICON[st]}
              </span>
            </div>
          )
        })}
      </div>

      {/* карточка выбранного слота */}
      {selected && (
        <div style={{ marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontWeight: 800, fontSize: 16 }}>{selected.label === 'До' ? 'До поездки' : selected.label === 'После' ? 'После поездки' : `День ${selected.dayIndex}`}</span>
            <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12, width: 'auto' }} onClick={() => setSelected(null)}>✕</button>
          </div>
          {slotPhotos.length > 0 ? (
            <>
              <div className="shot" style={{ width: '100%', height: 260, borderRadius: 20, overflow: 'hidden' }}>
                <img src={slotPhotos[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <button
                className="btn-ghost"
                style={{ marginTop: 10, width: 'auto', padding: '8px 18px', fontSize: 13 }}
                onClick={() => { setPendingSlot(selected); inputRef.current?.click() }}
              >
                Заменить фото
              </button>
            </>
          ) : (
            <p className="sub" style={{ textAlign: 'center', padding: '30px 0' }}>Фото ещё нет</p>
          )}
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Проверить tsc**

```bash
cd app && npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 3: Коммит**

```bash
git add app/src/screens/trip/PhotoCalendar.tsx
git commit -m "feat(photos): PhotoCalendar component — slot strip + card"
```

---

## Task 4: Подключить в TripPhotos + обновить тест

**Files:**
- Modify: `app/src/screens/trip/TripPhotos.tsx`
- Modify: `app/src/screens/trip/TripPhotos.test.tsx`

**Interfaces:**
- Consumes: `PhotoCalendar` из `./PhotoCalendar`

- [ ] **Step 1: Обновить тест под новый сегмент «Календарь»**

В `app/src/screens/trip/TripPhotos.test.tsx` замени файл:

```tsx
import { it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as q from '../../api/queries'
import TripPhotos from './TripPhotos'

afterEach(() => vi.restoreAllMocks())

it('shows Календарь and Бинго segments', () => {
  vi.spyOn(q, 'useMemories').mockReturnValue({ data: [] } as any)
  vi.spyOn(q, 'useBingo').mockReturnValue({ data: { completed: 0, total: 9, tasks: [] }, isLoading: false } as any)
  vi.spyOn(q, 'useTrip').mockReturnValue({ data: { startDate: '2027-06-12', endDate: '2027-06-14', members: [] } } as any)
  const qc = new QueryClient()
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/trip/t1/photos']}>
        <Routes><Route path="/trip/:id/photos" element={<TripPhotos />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  expect(screen.getByText('Календарь')).toBeTruthy()
  fireEvent.click(screen.getByText('Бинго'))
  expect(screen.getByText('Собрано')).toBeTruthy()
})
```

- [ ] **Step 2: Запустить тест — убедиться что падает**

```bash
cd app && npx vitest run src/screens/trip/TripPhotos.test.tsx
```
Expected: FAIL (сегмент «Лента» ещё не переименован).

- [ ] **Step 3: Обновить TripPhotos.tsx**

В `app/src/screens/trip/TripPhotos.tsx` замени файл целиком:

```tsx
import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Icon, Empty, Loading } from '../../components'
import { useMemories, useBingo } from '../../api/queries'
import { uploadBingo } from '../../lib/uploads'
import { tg } from '../../lib/tg'
import PhotoCalendar from './PhotoCalendar'

export default function TripPhotos() {
  const nav = useNavigate()
  const qc = useQueryClient()
  const { id = '' } = useParams()
  const [seg, setSeg] = useState<'calendar' | 'bingo'>('calendar')
  const { data: bingo, isLoading } = useBingo(id)
  const inputRef = useRef<HTMLInputElement>(null)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const pickFor = (key: string) => { setActiveKey(key); inputRef.current?.click() }
  const onPick = (f: File | undefined) => {
    if (!f || !activeKey) return
    tg.haptic('light'); uploadBingo(qc, id, activeKey, f); setActiveKey(null)
  }

  return (
    <>
      <div className="seg" style={{ marginBottom: 14 }}>
        <button className={seg === 'calendar' ? 'on' : ''} onClick={() => setSeg('calendar')}>Календарь</button>
        <button className={seg === 'bingo' ? 'on' : ''} onClick={() => setSeg('bingo')}>Бинго</button>
      </div>

      {seg === 'calendar' && <PhotoCalendar tripId={id} />}

      {seg === 'bingo' && (
        <>
          <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => onPick(e.target.files?.[0])} />
          {isLoading && <Loading />}
          {bingo && (
            <>
              <div className="day" style={{ textAlign: 'center' }}>
                <div className="lbl">Собрано</div>
                <div className="big">{bingo.completed}<small>/{bingo.total}</small></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9, marginTop: 16 }}>
                {bingo.tasks.map((c) => (
                  <div key={c.key} onClick={() => pickFor(c.key)} style={{
                    aspectRatio: '1', borderRadius: 16, cursor: 'pointer', overflow: 'hidden',
                    border: '1px solid var(--line)', position: 'relative',
                    background: c.done ? 'var(--g1)' : 'var(--card)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                    textAlign: 'center', padding: 9, color: c.done ? 'var(--on-grad)' : 'var(--ink)',
                    fontWeight: 700, fontSize: 11.5, lineHeight: 1.15,
                  }}>
                    {c.photoUrl && <img src={c.photoUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: c.uploading ? 0.55 : 1 }} />}
                    <div style={{ position: 'relative', zIndex: 1, textShadow: c.photoUrl ? '0 1px 4px rgba(0,0,0,.6)' : 'none', color: c.photoUrl ? '#fff' : undefined }}>
                      {c.done && !c.photoUrl && <div style={{ fontSize: 18, marginBottom: 3 }}>✓</div>}
                      {c.text}
                    </div>
                  </div>
                ))}
              </div>
              <p className="sub" style={{ textAlign: 'center', marginTop: 16 }}>Тапни клетку и загрузи фото-кадр</p>
            </>
          )}
        </>
      )}
    </>
  )
}
```

- [ ] **Step 4: Запустить тест — убедиться что проходит**

```bash
cd app && npx vitest run src/screens/trip/TripPhotos.test.tsx
```
Expected: PASS.

- [ ] **Step 5: Полный прогон тестов и tsc**

```bash
cd app && npx tsc --noEmit && npx vitest run
```
Expected: 0 errors, все тесты green.

- [ ] **Step 6: Коммит**

```bash
git add app/src/screens/trip/TripPhotos.tsx app/src/screens/trip/TripPhotos.test.tsx
git commit -m "feat(photos): replace Лента with Календарь segment in TripPhotos"
```

---

## Task 5: Убрать пикер фаз из PhotoUpload

**Files:**
- Modify: `app/src/screens/PhotoUpload.tsx`

**Interfaces:**
- Consumes: location state `{ phase?: string; takenAt?: string }` из react-router (когда вызван из PhotoCalendar через `/upload`)
- Produces: вызывает `uploadMemory(qc, tripId, file, phase, takenAt)` с параметрами из state (если есть) или без

- [ ] **Step 1: Обновить PhotoUpload.tsx**

В `app/src/screens/PhotoUpload.tsx` замени файл целиком:

```tsx
import { useNavigate, useLocation } from 'react-router-dom'
import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Screen, TopBar } from '../components'
import { useActiveTripId } from '../api/queries'
import { uploadMemory } from '../lib/uploads'
import { tg } from '../lib/tg'

export default function PhotoUpload() {
  const nav = useNavigate()
  const qc = useQueryClient()
  const tripId = useActiveTripId()
  const location = useLocation()
  const slotState = (location.state as { phase?: string; takenAt?: string } | null) ?? {}
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const onPick = (f: File | undefined) => {
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const submit = () => {
    if (!file) return inputRef.current?.click()
    tg.haptic('medium')
    uploadMemory(qc, tripId, file, slotState.phase, slotState.takenAt)
    nav(-1)
  }

  return (
    <Screen nav={false}>
      <TopBar title="Загрузить фото" onBack={() => nav(-1)} />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => onPick(e.target.files?.[0])}
      />

      <div
        className="shot s2"
        style={{ width: '100%', height: 240, borderRadius: 24, display: 'grid', placeItems: 'center', cursor: 'pointer', overflow: 'hidden' }}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <>
            <div className="g" />
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', color: '#fff' }}>
              <div style={{ fontSize: 38 }}>📷</div>
              <div style={{ fontWeight: 800, marginTop: 6 }}>Снять или выбрать</div>
            </div>
          </>
        )}
      </div>

      <button className="btn-grad" style={{ marginTop: 18 }} onClick={submit}>
        {file ? 'Загрузить' : 'Выбрать фото'}
      </button>
      {file && <p className="sub" style={{ textAlign: 'center', marginTop: 10 }}>Загрузится в фоне — можно сразу вернуться к поездке</p>}
    </Screen>
  )
}
```

- [ ] **Step 2: Проверить tsc и тесты**

```bash
cd app && npx tsc --noEmit && npx vitest run
```
Expected: 0 errors, все тесты green.

- [ ] **Step 3: Коммит**

```bash
git add app/src/screens/PhotoUpload.tsx
git commit -m "feat(photos): remove phase picker from PhotoUpload — slot drives phase"
```

---

## Task 6: Финальная сборка, визуальный QA, пуш и деплой

**Files:** нет новых

- [ ] **Step 1: Финальный build**

```bash
cd app && npm run build
```
Expected: `✓ built in ...` без ошибок.

- [ ] **Step 2: Запустить dev-сервер и проверить вручную**

```bash
cd app && npm run dev
```

Открыть `http://localhost:517X/trip/bcn-2027/photos`.

Проверить:
- Сегмент «Календарь» виден по умолчанию
- Слоты отображаются: До · Д1 · Д2 … · После
- Слоты с MOCK-фото (`calendarPhotos`) показывают ✓
- Пустые прошедшие слоты — 📷
- Будущие слоты — ○, не кликабельны
- Тап на 📷 → открывает file input (camera)
- Тап на ✓ → показывает карточку с фото

- [ ] **Step 3: Пуш на origin**

```bash
git push origin main
```

- [ ] **Step 4: Деплой**

```bash
./deploy.sh
```

Expected: `https://trip-radar.ru → 200`, `/api/v1/trips → 401`.
