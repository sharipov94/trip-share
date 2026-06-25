# Navigation v2.0 — Phase 1 (Skeleton) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mixed global/trip navigation with a 4-tab global bottom nav, a central «+» create button, and trip-scoped URLs (`/trip/:id/*`) rendered by a single trip shell — removing the duplicated Расходы/Фото tabs and making the current-trip context explicit.

**Architecture:** Frontend-only (React + react-router-dom v6). A persisted "current trip" (`localStorage`) replaces the implicit `trips[0]`. `TripShell` owns the trip header + segmented sub-nav and renders nested routes via `<Outlet/>`. The monolithic `TripDetails` is split into five focused sub-screens. No backend changes in this phase; all data comes from existing endpoints.

**Tech Stack:** Vite, React 18, react-router-dom v6 (nested routes + `<Outlet>`), @tanstack/react-query, Vitest + Testing Library, ESLint.

## Global Constraints

- Russian UI copy; match existing tone (e.g. "Поездка", "Расходы").
- No new runtime dependencies.
- Every screen wrapped in `<Screen>` (renders `BottomNav`) unless it's a nested trip route (the shell renders nav once).
- `npx tsc --noEmit` clean, `npm run lint` 0 errors, `npx vitest run` green before each commit.
- Telegram back button handled by existing `TelegramChrome` in `App.tsx` — keep `ROOT` paths in sync with new top-level routes.
- Bottom nav has exactly 4 items + a central FAB; do not exceed.

---

### Task 1: Current-trip persistence lib

**Files:**
- Create: `app/src/lib/currentTrip.ts`
- Test: `app/src/lib/currentTrip.test.ts`

**Interfaces:**
- Produces: `getCurrentTripId(): string | null`, `setCurrentTripId(id: string): void`, `clearCurrentTripId(): void`, `resolveCurrentTrip(trips: {id:string;status:string}[]): string` (returns stored id if still in list, else first `active`, else first trip, else '').

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { getCurrentTripId, setCurrentTripId, clearCurrentTripId, resolveCurrentTrip } from './currentTrip'

describe('currentTrip', () => {
  beforeEach(() => localStorage.clear())

  it('persists and reads the id', () => {
    setCurrentTripId('t1')
    expect(getCurrentTripId()).toBe('t1')
    clearCurrentTripId()
    expect(getCurrentTripId()).toBe(null)
  })

  it('resolves stored id when still present', () => {
    setCurrentTripId('t2')
    expect(resolveCurrentTrip([{ id: 't1', status: 'active' }, { id: 't2', status: 'finished' }])).toBe('t2')
  })

  it('falls back to first active when stored id is gone', () => {
    setCurrentTripId('missing')
    expect(resolveCurrentTrip([{ id: 't1', status: 'planning' }, { id: 't2', status: 'active' }])).toBe('t2')
  })

  it('falls back to first trip when none active', () => {
    expect(resolveCurrentTrip([{ id: 't1', status: 'planning' }])).toBe('t1')
  })

  it('returns empty string for no trips', () => {
    expect(resolveCurrentTrip([])).toBe('')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npx vitest run src/lib/currentTrip.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// app/src/lib/currentTrip.ts
const KEY = 'tm_current_trip'

export const getCurrentTripId = (): string | null => localStorage.getItem(KEY)
export const setCurrentTripId = (id: string): void => localStorage.setItem(KEY, id)
export const clearCurrentTripId = (): void => localStorage.removeItem(KEY)

/** Текущая поездка: сохранённая (если ещё в списке) → первая активная → первая → ''. */
export function resolveCurrentTrip(trips: { id: string; status: string }[]): string {
  const stored = getCurrentTripId()
  if (stored && trips.some((t) => t.id === stored)) return stored
  return trips.find((t) => t.status === 'active')?.id ?? trips[0]?.id ?? ''
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npx vitest run src/lib/currentTrip.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/currentTrip.ts app/src/lib/currentTrip.test.ts
git commit -m "feat(nav): current-trip persistence lib"
```

---

### Task 2: Wire current-trip into queries

**Files:**
- Modify: `app/src/api/queries.ts:21-31` (`useActiveTripId`, `useActiveTrip`)

**Interfaces:**
- Consumes: `resolveCurrentTrip`, `setCurrentTripId` from Task 1.
- Produces: `useCurrentTripId(): string` (resolves from trips list + storage), `useSetCurrentTrip(): (id: string) => void`. Keep `useActiveTripId`/`useActiveTrip` as aliases delegating to the current-trip versions so existing screens keep working until they migrate.

- [ ] **Step 1: Replace the active-trip hooks**

```ts
// app/src/api/queries.ts — replace useActiveTripId/useActiveTrip block
import { resolveCurrentTrip, setCurrentTripId } from '../lib/currentTrip'

/** id текущей поездки (из localStorage, иначе первая активная). */
export function useCurrentTripId(): string {
  const { data } = useTrips()
  return resolveCurrentTrip(data ?? [])
}

export function useSetCurrentTrip() {
  const qc = useQueryClient()
  return (id: string) => {
    setCurrentTripId(id)
    qc.invalidateQueries({ queryKey: ['trip'] })
  }
}

/** Текущая поездка целиком (с участниками). */
export function useCurrentTrip() {
  return useTrip(useCurrentTripId())
}

// обратная совместимость со старыми экранами (мигрируют в Task 6-10)
export const useActiveTripId = useCurrentTripId
export const useActiveTrip = useCurrentTrip
```

- [ ] **Step 2: Verify typecheck + existing tests**

Run: `cd app && npx tsc --noEmit && npx vitest run`
Expected: tsc clean; existing tests PASS.

- [ ] **Step 3: Commit**

```bash
git add app/src/api/queries.ts
git commit -m "feat(nav): persisted current-trip hooks (alias active-trip)"
```

---

### Task 3: 4-tab BottomNav + Финансы placeholder

**Files:**
- Modify: `app/src/components/nav.tsx` (items list)
- Modify: `app/src/components/icons.tsx` (add `Icon.finance` if missing — reuse `Icon.money` otherwise)
- Create: `app/src/screens/Finance.tsx` (placeholder for Phase 2)
- Modify: `app/src/App.tsx` (add `/finance` route; update `ROOT`)

**Interfaces:**
- Produces: bottom nav with 4 links — `/` Сегодня, `/trips` Поездки, `/finance` Финансы, `/profile` Профиль.

- [ ] **Step 1: Update BottomNav items**

```tsx
// app/src/components/nav.tsx — replace items array in BottomNav
const items = [
  { to: '/', icon: Icon.home, label: 'Сегодня', end: true },
  { to: '/trips', icon: Icon.trips, label: 'Поездки' },
  { to: '/finance', icon: Icon.money, label: 'Финансы' },
  { to: '/profile', icon: Icon.user, label: 'Профиль' },
]
```

- [ ] **Step 2: Create Finance placeholder screen**

```tsx
// app/src/screens/Finance.tsx
import { Screen, Empty } from '../components'

export default function Finance() {
  return (
    <Screen>
      <div className="top">
        <div>
          <div className="hello">Все деньги</div>
          <div className="title-grad trip" style={{ fontSize: 30 }}>Финансы</div>
        </div>
      </div>
      <Empty text="Сводка по всем поездкам появится здесь" />
    </Screen>
  )
}
```

- [ ] **Step 3: Route + ROOT update in App.tsx**

Add import `import Finance from './screens/Finance'`. Add route `<Route path="/finance" element={<Finance />} />`. Update `const ROOT = ['/', '/trips', '/finance', '/profile']`.

- [ ] **Step 4: Verify build + lint**

Run: `cd app && npx tsc --noEmit && npm run build && npm run lint`
Expected: build OK, 0 lint errors.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/nav.tsx app/src/screens/Finance.tsx app/src/App.tsx
git commit -m "feat(nav): 4-tab bottom nav + Финансы placeholder"
```

---

### Task 4: «+» Create FAB

**Files:**
- Create: `app/src/components/CreateFab.tsx`
- Modify: `app/src/components/index.ts` (export `CreateFab`)
- Modify: `app/src/components/bars.tsx` (render `<CreateFab/>` inside `Screen` when `nav` is true)

**Interfaces:**
- Consumes: `useCurrentTripId` (Task 2), `useNavigate`, `tg.haptic`.
- Produces: `CreateFab` — floating button opening a sheet with 4 actions. Expense/activity/photo navigate using the current trip; with no trip they route to `/trip/new`.

- [ ] **Step 1: Create the component**

```tsx
// app/src/components/CreateFab.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentTripId } from '../api/queries'
import { tg } from '../lib/tg'

export function CreateFab() {
  const nav = useNavigate()
  const tripId = useCurrentTripId()
  const [open, setOpen] = useState(false)

  const go = (path: string) => { setOpen(false); tg.haptic('light'); nav(path) }
  const inTrip = (path: string) => tripId ? go(path) : go('/trip/new')

  const actions = [
    { label: '🧳 Новая поездка', run: () => go('/trip/new') },
    { label: '💸 Новый расход', run: () => inTrip('/expense/new') },
    { label: '📅 Новая активность', run: () => inTrip('/activity/new') },
    { label: '📷 Загрузить фото', run: () => inTrip('/upload') },
  ]

  return (
    <>
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.45)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg)', borderRadius: '22px 22px 0 0', padding: '14px 16px calc(env(safe-area-inset-bottom,0px) + 18px)' }}>
            <div className="lbl" style={{ textAlign: 'center', color: 'var(--muted)', margin: '4px 0 12px' }}>Создать</div>
            {actions.map((a) => (
              <button key={a.label} className="btn-solid" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 9 }} onClick={a.run}>{a.label}</button>
            ))}
          </div>
        </div>
      )}
      <button
        aria-label="Создать"
        onClick={() => { tg.haptic('light'); setOpen(true) }}
        style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 'calc(env(safe-area-inset-bottom,0px) + 64px)', zIndex: 55, width: 56, height: 56, borderRadius: '50%', border: 'none', background: 'var(--g1)', color: 'var(--on-grad)', fontSize: 30, lineHeight: '56px', boxShadow: '0 10px 26px rgba(0,0,0,.3)', cursor: 'pointer' }}
      >+</button>
    </>
  )
}
```

- [ ] **Step 2: Export it**

In `app/src/components/index.ts` add: `export { CreateFab } from './CreateFab'`

- [ ] **Step 3: Render inside Screen**

In `app/src/components/bars.tsx`, import `CreateFab` from `./CreateFab` and render it right before `{nav && <BottomNav />}`:

```tsx
{nav && <CreateFab />}
{nav && <BottomNav />}
```

- [ ] **Step 4: Verify build + lint + manual**

Run: `cd app && npx tsc --noEmit && npm run build && npm run lint`
Expected: clean. Manual (optional): FAB opens sheet; actions navigate.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/CreateFab.tsx app/src/components/index.ts app/src/components/bars.tsx
git commit -m "feat(nav): central + create FAB with action sheet"
```

---

### Task 5: TripShell with segmented sub-nav

**Files:**
- Create: `app/src/screens/trip/TripShell.tsx`
- Test: `app/src/screens/trip/TripShell.test.tsx`

**Interfaces:**
- Consumes: `useTrip`, `useSetCurrentTrip` (Task 2), `useParams`, `<Outlet>`, `NavLink`.
- Produces: `TripShell` — renders trip header (back to `/trips`, title, status) + segmented links to `plan|expenses|photos|members|summary` (relative), then `<Outlet/>`. On mount sets current trip = `:id`. Wrapped in `<Screen>` so nav+FAB render once for all trip sub-routes.

- [ ] **Step 1: Write the failing test (sub-nav renders + links)**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TripShell from './TripShell'

it('renders the five trip sub-nav links', () => {
  const qc = new QueryClient()
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/trip/t1/plan']}>
        <Routes><Route path="/trip/:id" element={<TripShell />}><Route path="plan" element={<div>plan</div>} /></Route></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  for (const label of ['План', 'Расходы', 'Фото', 'Участники', 'Итоги']) {
    expect(screen.getByText(label)).toBeTruthy()
  }
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd app && npx vitest run src/screens/trip/TripShell.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement TripShell**

```tsx
// app/src/screens/trip/TripShell.tsx
import { useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { Screen, TopBar } from '../../components'
import { useTrip, useSetCurrentTrip } from '../../api/queries'

const SUB = [
  { to: 'plan', label: 'План' },
  { to: 'expenses', label: 'Расходы' },
  { to: 'photos', label: 'Фото' },
  { to: 'members', label: 'Участники' },
  { to: 'summary', label: 'Итоги' },
]
const STATUS: Record<string, string> = { planning: 'Планируется', active: 'Активна', finished: 'Завершена' }

export default function TripShell() {
  const nav = useNavigate()
  const { id = '' } = useParams()
  const { data: trip } = useTrip(id)
  const setCurrent = useSetCurrentTrip()
  useEffect(() => { if (id) setCurrent(id) /* eslint-disable-next-line */ }, [id])

  return (
    <Screen>
      <TopBar title={trip?.title ?? 'Поездка'} onBack={() => nav('/trips')} />
      {trip && <div className="sub" style={{ margin: '-8px 2px 8px' }}>{STATUS[trip.status]}{trip.dates ? ' · ' + trip.dates : ''}</div>}
      <div className="tabs">
        {SUB.map((s) => (
          <NavLink key={s.to} to={s.to} className={({ isActive }) => (isActive ? 'on' : '')}>{s.label}</NavLink>
        ))}
      </div>
      <Outlet />
    </Screen>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd app && npx vitest run src/screens/trip/TripShell.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/screens/trip/TripShell.tsx app/src/screens/trip/TripShell.test.tsx
git commit -m "feat(nav): TripShell with trip header + segmented sub-nav"
```

---

### Task 6: Trip sub-screen — План (activities)

**Files:**
- Create: `app/src/screens/trip/Plan.tsx`

**Interfaces:**
- Consumes: `useParams` (`id`), `useActivities`. Produces: default-export `Plan` rendering the activities list (moved verbatim from `TripDetails` activities tab, lines ~76-90), with «Добавить активность» → `/activity/new`. No `<Screen>`/`<TopBar>` (the shell provides them).

- [ ] **Step 1: Implement Plan**

```tsx
// app/src/screens/trip/Plan.tsx
import { useNavigate, useParams } from 'react-router-dom'
import { Icon, Loading, Empty } from '../../components'
import { useActivities } from '../../api/queries'

export default function Plan() {
  const nav = useNavigate()
  const { id = '' } = useParams()
  const { data: activities, isLoading } = useActivities(id)
  return (
    <>
      <div className="sec"><h2>Все активности</h2><div className="line" /><span className="cnt">{activities?.length ?? 0}</span></div>
      {isLoading && <Loading />}
      {activities && activities.length === 0 && <Empty text="Активностей пока нет" />}
      {activities?.map((a) => (
        <div key={a.id} className={'act' + (a.night ? ' night' : '')} style={{ cursor: 'pointer' }} onClick={() => nav('/activity/' + a.id)}>
          <div className="bar" />
          <div className="time"><b>{a.time}</b><s>{a.part}</s></div>
          <div className="body">
            <div className="ttl">{a.title}</div>
            <div className="sub">{a.sub}</div>
            <span className="badge ok">{a.status === 'completed' ? `Завершена ✓ · ${a.going} ходили` : a.status === 'confirmed' ? `Подтверждена · идут ${a.going}` : `Голосование · ${a.going} за`}</span>
          </div>
        </div>
      ))}
      <button className="btn-grad" style={{ marginTop: 6 }} onClick={() => nav('/activity/new')}><Icon.plus /> Добавить активность</button>
    </>
  )
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd app && npx tsc --noEmit`
Expected: clean (route wiring happens in Task 11).

- [ ] **Step 3: Commit**

```bash
git add app/src/screens/trip/Plan.tsx
git commit -m "feat(nav): trip Plan sub-screen (activities)"
```

---

### Task 7: Trip sub-screen — Расходы

**Files:**
- Create: `app/src/screens/trip/TripExpenses.tsx`

**Interfaces:**
- Consumes: `useParams`, `useExpenses`. Produces: default-export `TripExpenses` — expenses list + total + «Баланс →» + «Новый расход» (from `TripDetails` expenses tab).

- [ ] **Step 1: Implement**

```tsx
// app/src/screens/trip/TripExpenses.tsx
import { useNavigate, useParams } from 'react-router-dom'
import { Icon, Loading, Empty } from '../../components'
import { useExpenses } from '../../api/queries'

export default function TripExpenses() {
  const nav = useNavigate()
  const { id = '' } = useParams()
  const { data: expenses, isLoading } = useExpenses(id)
  const total = expenses?.reduce((s, e) => s + e.amount, 0) ?? 0
  return (
    <>
      <div className="card" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><div className="sub" style={{ margin: 0 }}>Всего потрачено</div><div className="font-display" style={{ fontWeight: 900, fontSize: 26 }}>€{total}</div></div>
        <button className="btn-ghost" onClick={() => nav('/balance')}>Баланс →</button>
      </div>
      {isLoading && <Loading />}
      {expenses && expenses.length === 0 && <Empty text="Расходов пока нет" />}
      {expenses?.map((e) => (
        <div key={e.id} className="row-item" style={{ cursor: 'pointer' }} onClick={() => nav('/expense/' + e.id)}>
          <div className="av" style={{ background: 'var(--g3)', color: 'var(--on-grad)' }}>{e.cat[0]}</div>
          <div className="grow"><div className="ttl" style={{ fontSize: 15 }}>{e.title}</div><div className="sub">{e.cat} · платил {e.payer}</div></div>
          <div className="amt">{e.cur}{e.amount}</div>
        </div>
      ))}
      <button className="btn-grad" style={{ marginTop: 6 }} onClick={() => nav('/expense/new')}><Icon.plus /> Новый расход</button>
    </>
  )
}
```

- [ ] **Step 2: Verify typecheck** — Run: `cd app && npx tsc --noEmit` → clean.

- [ ] **Step 3: Commit**

```bash
git add app/src/screens/trip/TripExpenses.tsx
git commit -m "feat(nav): trip Расходы sub-screen"
```

---

### Task 8: Trip sub-screen — Фото

**Files:**
- Create: `app/src/screens/trip/TripPhotos.tsx`

**Interfaces:**
- Consumes: `useParams`, `useMemories`. Produces: default-export `TripPhotos` — Фото/Bingo buttons + gallery (from `TripDetails` memories tab).

- [ ] **Step 1: Implement**

```tsx
// app/src/screens/trip/TripPhotos.tsx
import { useNavigate, useParams } from 'react-router-dom'
import { Icon, Empty } from '../../components'
import { useMemories } from '../../api/queries'

export default function TripPhotos() {
  const nav = useNavigate()
  const { id = '' } = useParams()
  const { data: photos } = useMemories(id)
  return (
    <>
      <div style={{ display: 'flex', gap: 9, marginBottom: 14 }}>
        <button className="btn-grad" style={{ flex: 1 }} onClick={() => nav('/upload')}><Icon.plus /> Фото</button>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={() => nav('/bingo')}>🎯 Bingo</button>
      </div>
      {(!photos || photos.length === 0) && <Empty text="Фотографий пока нет. Загрузи первое воспоминание 📸" />}
      {photos && photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {photos.map((p) => (
            <div key={p.id} className="shot" style={{ width: '100%', height: 104 }}>
              <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {p.author && <div className="tag">{p.author}</div>}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Verify typecheck** — Run: `cd app && npx tsc --noEmit` → clean.

- [ ] **Step 3: Commit**

```bash
git add app/src/screens/trip/TripPhotos.tsx
git commit -m "feat(nav): trip Фото sub-screen"
```

---

### Task 9: Trip sub-screen — Участники

**Files:**
- Create: `app/src/screens/trip/Members.tsx`

**Interfaces:**
- Consumes: `useParams`, `useTrip`. Produces: default-export `Members` — participants list + «Пригласить» (`/invite`) + «Изменить поездку» (`/trip/:id/edit`). (Delete lives in `/trip/:id/edit` danger zone already.)

- [ ] **Step 1: Implement**

```tsx
// app/src/screens/trip/Members.tsx
import { useNavigate, useParams } from 'react-router-dom'
import { Icon, Av } from '../../components'
import { useTrip } from '../../api/queries'

const AV = ['var(--accent)', 'var(--ok)', 'var(--chip-bg)', 'var(--accent)', 'var(--ok)']

export default function Members() {
  const nav = useNavigate()
  const { id = '' } = useParams()
  const { data: trip } = useTrip(id)
  return (
    <>
      <button className="btn-grad" style={{ margin: '4px 0 6px' }} onClick={() => nav('/invite')}><Icon.plus /> Пригласить участников</button>
      <button className="btn-ghost" style={{ width: '100%', marginBottom: 6 }} onClick={() => nav('/trip/' + id + '/edit')}>Изменить поездку</button>
      <div className="sec"><h2>Участники</h2><div className="line" /><span className="cnt">{trip?.members.length ?? 0}</span></div>
      {trip?.members.map((m, i) => (
        <div key={m.id} className="row-item">
          <Av url={m.avatarUrl} initial={m.initial} bg={AV[i % 5]} />
          <div className="grow"><div className="ttl" style={{ fontSize: 15 }}>{m.name}</div><div className="sub">{i === 0 ? 'организатор' : 'участник'}</div></div>
        </div>
      ))}
    </>
  )
}
```

- [ ] **Step 2: Verify typecheck** — Run: `cd app && npx tsc --noEmit` → clean.

- [ ] **Step 3: Commit**

```bash
git add app/src/screens/trip/Members.tsx
git commit -m "feat(nav): trip Участники sub-screen"
```

---

### Task 10: Trip sub-screen — Итоги

**Files:**
- Create: `app/src/screens/trip/Summary.tsx`

**Interfaces:**
- Consumes: `useParams`, `useTrip`, `useActivities`, `useExpenses`, `useMemories`. Produces: default-export `Summary` — Wrapped entry + stat cards (from `TripDetails` summary tab).

- [ ] **Step 1: Implement**

```tsx
// app/src/screens/trip/Summary.tsx
import { useNavigate, useParams } from 'react-router-dom'
import { useTrip, useActivities, useExpenses, useMemories } from '../../api/queries'

export default function Summary() {
  const nav = useNavigate()
  const { id = '' } = useParams()
  const { data: trip } = useTrip(id)
  const { data: activities } = useActivities(id)
  const { data: expenses } = useExpenses(id)
  const { data: photos } = useMemories(id)
  const total = expenses?.reduce((s, e) => s + e.amount, 0) ?? 0
  return (
    <>
      <div className="day" onClick={() => nav('/wrapped')} style={{ cursor: 'pointer' }}>
        <div className="lbl">Travel Wrapped</div>
        <div className="font-display" style={{ fontWeight: 900, fontSize: 24, marginTop: 8, lineHeight: 1.05 }}>История поездки<br />в слайдах →</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
        {[
          [String(trip?.members.length ?? 0), 'участников'],
          [String(activities?.length ?? 0), 'активностей'],
          [String(photos?.length ?? 0), 'фото'],
          ['€' + total, 'расходы'],
        ].map(([n, l]) => (
          <div key={l} className="card" style={{ textAlign: 'center', padding: '18px 10px' }}>
            <div className="font-display" style={{ fontWeight: 900, fontSize: 26 }}>{n}</div>
            <div className="sub" style={{ margin: 0 }}>{l}</div>
          </div>
        ))}
      </div>
      <button className="btn-grad" style={{ marginTop: 16 }} onClick={() => nav('/wrapped')}>Смотреть Wrapped</button>
    </>
  )
}
```

- [ ] **Step 2: Verify typecheck** — Run: `cd app && npx tsc --noEmit` → clean.

- [ ] **Step 3: Commit**

```bash
git add app/src/screens/trip/Summary.tsx
git commit -m "feat(nav): trip Итоги sub-screen"
```

---

### Task 11: Rewire routing to nested trip routes

**Files:**
- Modify: `app/src/App.tsx` (imports, routes, ROOT)

**Interfaces:**
- Consumes: `TripShell`, `Plan`, `TripExpenses`, `TripPhotos`, `Members`, `Summary` (Tasks 5-10), `Navigate` from react-router-dom.

- [ ] **Step 1: Update imports**

Remove `import TripDetails from './screens/TripDetails'`. Add:

```tsx
import { Navigate } from 'react-router-dom'
import TripShell from './screens/trip/TripShell'
import Plan from './screens/trip/Plan'
import TripExpenses from './screens/trip/TripExpenses'
import TripPhotos from './screens/trip/TripPhotos'
import Members from './screens/trip/Members'
import Summary from './screens/trip/Summary'
```

- [ ] **Step 2: Replace trip + global-alias routes**

Replace the `/trip/:id` route and the `/expenses` and `/memories` alias routes with:

```tsx
<Route path="/trip/:id" element={<TripShell />}>
  <Route index element={<Navigate to="plan" replace />} />
  <Route path="plan" element={<Plan />} />
  <Route path="expenses" element={<TripExpenses />} />
  <Route path="photos" element={<TripPhotos />} />
  <Route path="members" element={<Members />} />
  <Route path="summary" element={<Summary />} />
</Route>
```

Keep `/trip/:id/edit` as its own top-level route (TripEdit, outside the shell). Delete the old `<Route path="/expenses" .../>` and `<Route path="/memories" .../>` lines.

- [ ] **Step 3: Verify build + lint + tests**

Run: `cd app && npx tsc --noEmit && npm run build && npm run lint && npx vitest run`
Expected: build OK (no more TripDetails import errors), 0 lint errors, tests green.

- [ ] **Step 4: Commit**

```bash
git add app/src/App.tsx
git commit -m "feat(nav): nested /trip/:id/* routes via TripShell"
```

---

### Task 12: Rename Trips toolbar labels

**Files:**
- Modify: `app/src/screens/Trips.tsx` (the `TABS` array titles)

**Interfaces:**
- Produces: toolbar labels per audit — Активные / Будущие / Архив (statuses unchanged: active/planning/finished).

- [ ] **Step 1: Update labels**

```tsx
const TABS: { status: Trip['status']; title: string }[] = [
  { status: 'active', title: 'Активные' },
  { status: 'planning', title: 'Будущие' },
  { status: 'finished', title: 'Архив' },
]
```

Also update the empty-state copy that interpolates the title — it already reads `TABS.find(...)?.title`, so no extra change.

- [ ] **Step 2: Verify build + lint** — Run: `cd app && npx tsc --noEmit && npm run lint` → clean.

- [ ] **Step 3: Commit**

```bash
git add app/src/screens/Trips.tsx
git commit -m "feat(nav): rename trips toolbar to Активные/Будущие/Архив"
```

---

### Task 13: Remove dead TripDetails + final verification

**Files:**
- Delete: `app/src/screens/TripDetails.tsx`

**Interfaces:** none (cleanup).

- [ ] **Step 1: Confirm no references remain**

Run: `cd app && grep -rn "TripDetails" src` → Expected: no matches.

- [ ] **Step 2: Delete the file**

```bash
git rm app/src/screens/TripDetails.tsx
```

- [ ] **Step 3: Full verification**

Run: `cd app && npx tsc --noEmit && npm run build && npm run lint && npx vitest run`
Expected: tsc clean, build OK, 0 lint errors, all tests green.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(nav): remove monolithic TripDetails (split into trip/* sub-screens)"
```

---

## Self-Review

**Spec coverage (Phase 1 scope only):**
- 4-tab bottom nav → Task 3 ✓
- Central «+» → Task 4 ✓
- `/trip/:id/*` routes + TripShell + split TripDetails → Tasks 5-11 ✓
- `tm_current_trip` persistence → Tasks 1-2 ✓
- Trips toolbar Активные/Будущие/Архив → Task 12 ✓
- Сегодня dashboard: unchanged in Phase 1 (Home already shows current trip via `useActiveTrip` alias) — «Напоминания» block deferred to Phase 4 per spec §7.
- Финансы/Аналитика/Профиль content: Phase 2-4 (placeholder route only here, Task 3) ✓

**Placeholder scan:** No TBD/TODO; all steps carry real code. ✓

**Type consistency:** `useCurrentTripId`/`useCurrentTrip`/`useSetCurrentTrip` defined in Task 2 and consumed in Tasks 4-5; `resolveCurrentTrip` signature matches Task 1 test; sub-screens consume existing `useActivities/useExpenses/useMemories/useTrip` unchanged. ✓

**Note:** `/profile` route already exists in v1; unchanged here. `/balance`, `/expense/new`, `/activity/new`, `/upload`, `/invite`, `/trip/:id/edit` remain top-level and are reached from sub-screens — verified against current `App.tsx`.

## Out of scope (later phases)
Global `/me/*` finance endpoints + Finance screen content (Phase 2), analytics/categories (Phase 3), Профиль sub-sections + native currency + Напоминания (Phase 4). Each gets its own plan.
