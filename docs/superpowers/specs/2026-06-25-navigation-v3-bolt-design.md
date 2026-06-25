# Navigation v3 — Bolt model on our stack

**Date:** 2026-06-25
**Status:** Approved (direction), authored autonomously after user delegated
**Supersedes:** parts of `2026-06-25-navigation-v2-design.md` (kills the global Финансы tab,
the «Сегодня» tab, the central FAB, and the ambient "current trip" concept).

## Context

After Phase 1 of nav v2.0 shipped (4-tab bottom nav + central FAB + nested `/trip/:id/*`),
a UX/IA review flagged 9 problems (A–I): double navigation inside a trip, an invisible
"current trip", a FAB that silently redirects, money scattered across 5 places, orphaned
screens (`/wrapped/me`, `/splash`, buried Bingo), inconsistent back behavior, inconsistent
tab hiding, fragile debt personalization, and emoji-as-icons.

The user then generated a full alternative design in Bolt (repo `sharipov94/123`, cloned to
`MiniverseVault/bolt-123`) — a more conventional Splitwise/TripIt-style model — and chose to
**adopt that model wholesale**, keeping our stack (react-router, react-query, theme/palette
engine, Telegram WebApp, Russian UI, `icons.tsx`). We port Bolt's **structure/IA and screen
layouts**, not its visual stack (no Tailwind, no slate theme, no lucide).

User's one explicit change to the Bolt model: the in-trip `Memories` tab becomes **«Фото»**,
and inside «Фото» there are two segments — **Фото / Бинго**.

## Decisions (resolved)

| # | Decision |
|---|---|
| Nav hierarchy | Drill-down: trip is a context you enter and leave via back. |
| Bottom nav | **2 tabs**: Поездки · Профиль. No Сегодня, no Финансы, no FAB. |
| Current trip / FAB | **Removed.** No ambient current-trip; create actions are contextual. |
| Global finance | **Removed.** Money lives inside a trip. |
| Visual stack | Keep ours (themes, custom CSS, `icons.tsx`, Telegram). |
| Wrapped (trip) | Card in the **Обзор** tab (decision A). |
| Wrapped (personal) | Row in **Профиль** → `/wrapped/me`. |
| Splash | Delete the dead `/splash` route. |

This redesign dissolves review problems **A, B, C, D, E, F, G, I** structurally. **H**
(show all debts, not just `from === 'Ты'`) is handled by the new Обзор balance section,
which lists every balance involving the current user.

## Target information architecture

```
/                      → redirect to /trips
/trips                 Поездки (home): welcome header + Активные/Планируется/Завершённые
                       + "Новая поездка" button.  Bottom nav: shown.
/profile               Профиль: account card + Аккаунт/Настройки sections + Мой Wrapped.
                       Bottom nav: shown.

/trip/:id              TripShell: hero (cover + back + participants chip) + 3 summary pills
                       + inner tabs. Bottom nav: shown.
  /trip/:id/overview   Обзор  (default; was nonexistent — new dashboard tab)
  /trip/:id/expenses   Расходы
  /trip/:id/activities Активности  (was «План»)
  /trip/:id/photos     Фото  (segments: Лента | Бинго)

push screens (Bottom nav: HIDDEN):
  /trip/new, /trip/:id/edit, /trip/:id/members, /invite
  /expense/new, /expense/:id, /receipt
  /balance, /settle
  /activity/new, /activity/:id, /activity/:id/edit, /activity/:id/complete
  /upload
  /wrapped (trip), /wrapped/me (personal)
  (photo viewer — if/when added)

removed: /, /finance, /splash, central FAB, in-trip «Участники» tab, in-trip «Итоги» tab
```

### Bottom-nav visibility rule (fixes G)

`Screen` keeps its `nav` prop. The rule, applied consistently:
- **Shown:** `/trips`, `/profile`, `/trip/:id/*` (the four inner tabs).
- **Hidden (`nav={false}`):** every create/edit form, detail, viewer, settle, balance,
  invite, receipt, wrapped, members. I.e. anything reached as a push from a list/tab.

## Screens

### Trips list (`/trips`) — was `Trips.tsx`, absorbs `Home`
- Header: «С возвращением, {firstName}» + avatar (right).
- Sections by status: **Активные** (`active`) · **Планируется** (`planning`) ·
  **Завершённые** (`finished`). Each a labelled section with a count chip.
- Trip card: cover image with gradient, status badge (dot + label), name + destination
  overlay, meta row (members count, total spent, date range, avatar group).
- Empty state: «Поездок пока нет» + «Создать первую поездку».
- Bottom: full-width **«Новая поездка»** button → `/trip/new`.
- Uses our existing trip status values (`active|planning|finished`), our theme tokens,
  and `icons.tsx` icons.

### Trip detail shell (`/trip/:id`) — `TripShell.tsx`
- **Hero:** cover image (trip cover or theme gradient fallback), back button (top-left,
  `nav(-1)`), participants chip (top-right) → `/trip/:id/members`. Trip name + status dot
  + date range overlaid at the bottom of the hero.
- **3 summary pills:** Потрачено · (Должен / Должны тебе / Рассчитано) · Участников.
  The middle pill colors by sign (owe = negative/danger, owed = positive/success).
- **Inner tab bar:** Обзор · Расходы · Активности · Фото (underline-style active state,
  our tokens). Tabs are routes; default index → `overview`.
- Back from the shell uses `nav(-1)` (not hardcoded `/trips`) — fixes F.

### Обзор (`/trip/:id/overview`) — NEW
Dashboard, scoped to the trip:
- **Мой баланс** section: lists every balance involving the current user (each row:
  avatar, name, «Ты должен»/«Должен тебе», signed amount). "Показать все" → `/balance`.
  This replaces the fragile single-debt Home widget and fixes H.
- **Ближайшие** section: next 1–2 upcoming activities; empty → CTA «Добавить активность».
- **Недавние расходы** section: last 3; empty → CTA «Добавить расход».
- **Фото** preview: first 6 thumbnails → tab Фото.
- **Wrapped** card: entry to `/wrapped` (the trip recap), emphasized for `finished` trips.

### Расходы (`/trip/:id/expenses`) — `trip/TripExpenses.tsx`
Existing expense list, plus an in-tab «+ Расход» action (no FAB). Rows → `/expense/:id`.

### Активности (`/trip/:id/activities`) — `trip/Plan.tsx` renamed/retargeted
Existing plan/activities content, in-tab «+ Активность» action. Rows → `/activity/:id`.

### Фото (`/trip/:id/photos`) — `trip/TripPhotos.tsx` reworked
- Segmented control **«Лента | Бинго»** at top.
- **Лента:** photo grid + «+ Фото» → `/upload`. Empty state.
- **Бинго:** the existing Bingo grid (tap a cell → upload a photo-кадр). The current
  ghost emoji button is removed; Bingo is now a first-class segment. Bingo's own screen
  (`/bingo`) can be inlined here or kept as a push target rendered within the segment —
  implementation detail for the plan.

### Members (`/trip/:id/members`) — `trip/Members.tsx`
No longer a tab; reached from the hero participants chip. Push screen, `nav={false}`.

### Профиль (`/profile`) — `Profile.tsx`
- Header «Профиль» + account card (avatar, name, Telegram handle).
- **Аккаунт:** Изменить профиль → `/profile/edit`; Уведомления → `/profile/notifications`.
- **Настройки:** Валюта по умолчанию; Здоровье/Privacy → `/profile/health`.
- **Мой Wrapped** → `/wrapped/me`.
- App info + «Выйти».

## Removed / deleted

- `screens/Home.tsx` (role absorbed by `/trips` header).
- `screens/Finance.tsx` + `/finance` route (+ `expenses.all` / `useAllExpenses` if unused
  elsewhere — verify before deleting).
- `screens/Splash.tsx` + `/splash` route.
- `components/CreateFab.tsx` and its rendering in `BottomNav`.
- `Finance`/FAB-era ambient *guessing* in `lib/currentTrip.ts`. **Kept, simplified:** the
  "first active / first trip" fallback is removed; `currentTrip` becomes a plain
  "last-opened trip" set only by `TripShell` on entry and read by the trip-owned push
  screens (`/expense/*`, `/balance`, `/settle`, `/activity/*`, `/upload`, `/invite`,
  `/wrapped`). In v3 those screens are reachable only after entering a trip, so the value is
  unambiguous — this dissolves review problems B/C without re-scoping ~10 routes under
  `/trip/:id/*`. `useCurrentTripId()` returns the stored id or `''`; consumers redirect to
  `/trips` when empty. `useAllExpenses` (global finance) is deleted.
- In-trip «Итоги» (`trip/Summary.tsx`) as a tab (content folds into Обзор / Wrapped).
- The emoji action-sheet and emoji tab icons.

Before deleting each, grep for remaining references and migrate or drop them.

## Non-goals (explicitly out of scope)

- No Tailwind / slate theme / lucide migration — our visual system stays.
- No FX/multi-currency work (still paused; see settlements feature).
- No backend changes. Balances/expenses use existing API + client aggregation.
- No new "global finance" — money is per-trip only.

## Testing

- Unit: bottom-nav visibility rule; Обзор balance section lists all current-user balances
  (covers H); Trips status grouping; Фото segment switching.
- Update/remove obsolete tests: `currentTrip.test.ts` (file deleted), `TripShell.test.tsx`
  (tabs changed).
- Manual (MOCK mode) pass on each tab + drill-down + back behavior before review.

## Rollout

- Branch `feat/nav-v3-bolt`. Implement, typecheck, test, manual QA in MOCK.
- Version tag `v3.0` on merge. Do **not** deploy or push to `main` without user review.
</content>
</invoke>
