# Photo Calendar — Design Spec

**Date:** 2026-06-26  
**Status:** approved  
**Scope:** TG Mini App (мероприятия-фото — отдельный скоуп нативного приложения)

---

## Цель

Заменить бесструктурную ленту фото на личный трекер моментов: каждый участник фиксирует по одному фото на каждый значимый слот поездки. Слоты жёстко определены временем — система сама «открывает» их по ходу поездки.

---

## Слоты

| Слот | Phase value | Когда открывается |
|---|---|---|
| До поездки | `before_trip` | сразу (до `startDate`) |
| День N (N = 1…duration) | `during_trip` | когда текущая дата ≥ `startDate + (N-1) дней` |
| После поездки | `after_trip` | когда текущая дата > `endDate` |

**Ограничение:** одно фото на участника на слот. Повторная загрузка заменяет предыдущее (на уровне UI — пользователь видит предложение заменить).

---

## Статусы ячейки (личный трекер)

```
✓   — я загрузил → тап → просмотр моего фото
📷  — время пришло, фото нет → тап → открывается камера/пикер
○   — слот ещё не наступил → не кликабелен
```

Логика определения статуса:
1. `slotDate > today` → **○**
2. `slotDate ≤ today` и у меня нет фото этого слота → **📷**
3. `slotDate ≤ today` и у меня есть фото → **✓**

---

## UI: вкладка «Фото»

### Сегменты (без изменений)
```
[Календарь]  [Бинго]
```
Сегмент «Лента» переименовывается в «Календарь» и заменяется новым компонентом.

### Горизонтальная лента слотов
```
До  · Д1 · Д2 · Д3 · Д4 · После
 ✓    ✓    📷   ○    ○     ○
```
- Горизонтальный `overflow-x: scroll`, `scroll-snap-type: x mandatory`
- Активный слот (текущий день) автоматически центрируется при открытии
- Ячейка: ~72×88px, иконка-статус внизу, подпись («До» / «Д1» / «После») сверху

### Карточка слота (по тапу на ✓ или 📷)
**Статус 📷 (пора загрузить):**
```
[название слота, напр. «День 3»]
Фото ещё нет
[Сделать фото]   ← открывает camera capture
[Выбрать из галереи]
```

**Статус ✓ (уже загружено):**
```
[название слота]
<моё фото fullscreen-превью>
[Заменить]   ← мелкая ссылка внизу
```

Карточка реализуется как bottom sheet (или отдельный экран — на усмотрение при реализации).

---

## Модель данных

### Backend (без новых колонок)

Существующая сущность `Memory` уже имеет:
- `memoryPhase: MemoryPhase | null`
- `takenAt: Date | null`
- `activityId: string | null`

**Изменение в entity:** добавить `during_trip` в union `MemoryPhase`:
```ts
export type MemoryPhase =
  | 'before_activity' | 'during_activity' | 'after_activity'  // legacy, не используются в новом UI
  | 'before_trip' | 'during_trip' | 'after_trip'
```

**Кодирование дня:** для слота «День N» используем `phase = during_trip`, `takenAt = noon(startDate + (N-1) days)`. День вычисляется фронтендом из `takenAt` и `trip.startDate`.

**DB:** колонка `memoryPhase varchar(20)` — значение `during_trip` (11 символов) вписывается без миграции схемы. На проде нужно убедиться что `DB_SYNCHRONIZE=false` не мешает (новые данные — новое значение enum в коде, не в Postgres enum-type, т.к. это varchar).

### Frontend — маппинг

`memories.ts` — `BMemory` расширяется:
```ts
type BMemory = {
  id: string
  photoUrl: string
  userId: string | null
  activityId: string | null
  memoryPhase: string | null   // добавить
  takenAt: string | null       // добавить
}
```

`memories.list()` возвращает расширенный тип:
```ts
{ id: string; url: string; author: string; phase: string | null; takenAt: string | null }
```

### Frontend — вычисление слотов

Новая утилита `lib/photoSlots.ts`:

```ts
type SlotKind = 'before_trip' | 'during_trip' | 'after_trip'

type Slot = {
  key: string           // 'before_trip' | 'day_1' | 'day_2' | ... | 'after_trip'
  label: string         // 'До' | 'Д1' | 'Д2' | ... | 'После'
  kind: SlotKind
  date: Date            // для определения открытости
  dayIndex?: number     // 1-based, только для during_trip
}

function buildSlots(startDate: string, endDate: string): Slot[]
function slotStatus(slot: Slot, myPhotos: Photo[], today: Date): 'done' | 'open' | 'locked'
function slotForPhoto(phase: string, takenAt: string | null, startDate: string): string  // → key
```

---

## Загрузка фото

Точка входа: тап на ячейку со статусом 📷.

Передаём в `PhotoUpload` (или новый упрощённый компонент) предустановленный слот:
- `phase`: `before_trip` | `during_trip` | `after_trip`
- `takenAt`: дата слота (noon)

Пикер фаз из текущего `PhotoUpload.tsx` **убирается** (фаза определяется слотом).

Загрузка — через существующий `uploadMemory(qc, tripId, file, phase)` с добавлением `takenAt`.

---

## Скоуп изменений

### Server
| Файл | Изменение |
|---|---|
| `entities/memory.entity.ts` | `during_trip` в `MemoryPhase` union |

### Frontend
| Файл | Изменение |
|---|---|
| `api/memories.ts` | `BMemory` + `phase` + `takenAt` в маппинге |
| `lib/photoSlots.ts` | **новый** — утилиты слотов |
| `lib/uploads.ts` | `uploadMemory` принимает `takenAt` |
| `screens/trip/TripPhotos.tsx` | сегмент «Лента» → «Календарь», рендер `PhotoCalendar` |
| `screens/trip/PhotoCalendar.tsx` | **новый** — лента слотов + карточка |
| `screens/PhotoUpload.tsx` | убрать пикер фаз; принять `slot` из location state |
| `mocks/data.ts` | mock-фото с `phase` + `takenAt` для dev |
| `types/index.ts` | расширить тип Photo |

### No-op
- `memories.service.ts` — `list()` уже отдаёт полный entity, включая `memoryPhase` и `takenAt`
- `memories.controller.ts` — без изменений
- DB schema — без миграции (`varchar(20)`, `during_trip` = 11 символов)

---

## Out of scope (этот спек)

- Фото мероприятий (нативное приложение + бот-уведомления)
- Групповой коллаж из фото всех участников (позже)
- Просмотр чужих фото одного слота (позже)
