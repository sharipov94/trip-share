# Архитектура кода

Справочник по фактической структуре репозитория: что где лежит, как пакеты
связаны, какие переменные окружения и npm-скрипты есть. Это документация **по
коду как он есть** (в отличие от дизайн-спеков `01-10`, описывающих замысел).

Репозиторий — два независимых npm-пакета:

```
app/      Frontend — Vite + React + TypeScript, Telegram Mini App
server/   Backend  — NestJS + TypeScript + PostgreSQL
docs/     Спеки (01-10) и developer-доки (11-13)
schema.sql            Исполняемый DDL для PostgreSQL (прод)
docker-compose.prod.yml   Прод-композиция (Postgres + Redis + API)
```

Сервер и фронт деплоятся и запускаются раздельно. Фронт может работать вообще
без сервера — в MOCK-режиме (см. [12-development.md](12-development.md)).

---

## Frontend (`app/`)

Структура слоистая (layer-based): файлы сгруппированы по технической роли, а не
по фиче. Экраны лежат отдельно от UI-кита, API-слой отдельно от данных.

```
app/src/
├ api/              слой данных
│  ├ client.ts        низкоуровневый fetch: Bearer-токены, авто-refresh, MOCK-флаг
│  ├ queries.ts       React Query хуки (useTrips, useExpenses, ...) и ключи qk
│  ├ _internal.ts     общая инфраструктура доменов: кэш участников, namesFor/usersFor
│  ├ auth.ts          домен auth (telegram/dev/me/updateProfile)
│  ├ trips.ts         домен trips (list/get/balance/create/invite/join/summary)
│  ├ activities.ts    домен activities (+ голоса, комментарии)
│  ├ expenses.ts      домен expenses (+ участники, settle)
│  ├ memories.ts      домен memories (фото)
│  ├ bingo.ts         домен bingo (+ типы BingoTask/BingoState)
│  └ receipts.ts      домен receipts (OCR чека)
├ components/       UI-кит (импортируется из экранов через барель ./components)
│  ├ index.ts         public-поверхность: re-export всех компонентов
│  ├ icons.tsx        набор SVG-иконок (Icon.home, Icon.back, ...)
│  ├ nav.tsx          BottomNav, NavGradDef
│  ├ bars.tsx         TopBar, Screen (обёртка экрана)
│  ├ avatar.tsx       Av, Avatar
│  └ feedback.tsx     Loading, Empty, Toggle
├ lib/              утилиты без UI
│  ├ tg.ts            обёртка над Telegram WebApp (haptics, BackButton, инсеты)
│  ├ image.ts         клиентское сжатие изображений перед загрузкой
│  └ uploads.ts       оптимистичная фоновая загрузка фото (memory/bingo)
├ theme/            тема и палитры
│  ├ index.ts         public-поверхность (ThemeProvider, useTheme, PALETTES)
│  ├ palettes.ts      4 палитры, контекст, useTheme
│  └ ThemeProvider.tsx  провайдер: применяет data-theme, пишет в localStorage
├ types/index.ts    кросс-доменные frontend-типы (Trip)
├ mocks/data.ts     мок-данные прототипа (используются в MOCK-режиме)
├ screens/          ~30 экранов (по одному файлу на экран)
├ auth.tsx          AuthProvider — бутстрап сессии (Telegram → dev → refresh)
├ auth-context.ts   контекст + хук useAuth (отдельно от провайдера)
├ App.tsx           роуты приложения
└ main.tsx          точка входа: провайдеры (Query, Theme, Auth, Router)
```

**Поток данных:** экран → хук из `api/queries.ts` → доменный объект из `api/<domain>.ts`
→ `api/client.ts` (реальный backend) **или** `mocks/data.ts` (MOCK-режим). Решение
MOCK/реальный принимается один раз в `client.ts` по `VITE_API_URL`.

**Барели `index.ts`** в `components/` и `theme/` — это публичная поверхность слоя.
Экраны импортируют `from '../components'`, не из конкретных файлов. Это держит
импорты стабильными при перегруппировке внутренних файлов.

### npm-скрипты (`app/`)

| Скрипт | Команда | Назначение |
|--------|---------|-----------|
| `dev` | `vite` | Дев-сервер с HMR на :5173 |
| `build` | `tsc -b && vite build` | Прод-сборка в `dist/` (с проверкой типов) |
| `preview` | `vite preview` | Локальный предпросмотр прод-сборки |
| `lint` | `eslint .` | ESLint (flat config) |
| `test` | `vitest run` | Юнит-тесты один прогон |
| `test:watch` | `vitest` | Тесты в watch-режиме |

### Переменные окружения (`app/`)

| Переменная | Default | Эффект |
|-----------|---------|--------|
| `VITE_API_URL` | пусто | Пусто → **MOCK-режим** (заглушки, бэкенд не нужен). Адрес → реальные запросы к `<URL>/api/v1`. |

---

## Backend (`server/`)

NestJS, модульная структура: каждая фича — папка с `*.module.ts`, `*.controller.ts`,
`*.service.ts` и `dto/`. Глобальный `JwtAuthGuard` защищает все роуты, публичные
помечаются `@Public()`.

```
server/src/
├ main.ts             бутстрап: префикс /api/v1, CORS, ValidationPipe, проверка секретов
├ app.module.ts       корневой модуль: TypeORM, глобальный APP_GUARD
├ auth/               вход по Telegram initData, dev-вход, JWT access/refresh
├ users/              профиль (selfView/publicView), шифрование payment_details
├ trips/              поездки, участники, инвайт-токены, роли owner/admin/member
├ activities/         активности, голосование, комментарии
├ expenses/           расходы, деление, идемпотентность, balance.service (минимизация переводов)
├ memories/           фото-воспоминания (загрузка, по активности)
├ bingo/              трэвел-bingo
├ receipts/           OCR чека (tesseract)
├ notifications/      Telegram-бот, напоминания (BullMQ)
├ summary/            Travel Wrapped (агрегаты поездки)
├ common/             общая логика:
│  ├ guards/            JwtAuthGuard, TripMemberGuard
│  ├ decorators/        @Public, @CurrentUser
│  ├ membership.service.ts  object-level авторизация (assertMember/assertRole)
│  ├ telegram.ts        валидация initData (HMAC + replay-защита)
│  ├ crypto.ts          AES-256-GCM для payment_details
│  ├ money.ts           денежная математика (splitEqually, minimizeTransfers)
│  └ image-store.ts     сохранение изображений (sharp, ре-энкод, UUID-имена)
└ entities/           TypeORM-сущности (User, Trip, Expense, ...)
```

**Авторизация — два уровня.** Аутентификация: `JwtAuthGuard` (глобальный) проверяет
Bearer-токен. Авторизация ресурса: `MembershipService.assertMember(userId, tripId)` —
каждый вложенный ресурс грузится по id, затем проверяется членство по его
**собственному** `tripId`. Это исключает IDOR. Подробности модели угроз — в
[09-security.md](09-security.md).

### npm-скрипты (`server/`)

| Скрипт | Команда | Назначение |
|--------|---------|-----------|
| `start:dev` | `nest start --watch` | Дев-сервер с авто-перезапуском |
| `start` / `start:prod` | `nest start` / `node dist/main` | Запуск (dev / прод) |
| `build` | `nest build` | Компиляция в `dist/` |
| `lint` | `eslint .` | ESLint (flat config) |
| `test` | `jest` | Юнит-тесты (money, telegram) |
| `test:cov` | `jest --coverage` | Тесты с покрытием |

### Переменные окружения (`server/`)

| Переменная | Default | Назначение |
|-----------|---------|-----------|
| `DATABASE_URL` | — | Строка подключения PostgreSQL |
| `DB_SYNCHRONIZE` | `false` | `true` → таблицы из entities (только dev; в проде `schema.sql`) |
| `BOT_TOKEN` | — | Токен бота от @BotFather. **Без него вход через Telegram закрыт** (fail-closed) |
| `BOT_USERNAME` | `Share_trip_bot` | Username бота для инвайт-ссылок |
| `INITDATA_TTL` | `86400` | Макс. возраст initData в секундах (replay-защита) |
| `JWT_SECRET` | — | Секрет подписи JWT. В production сервер не стартует со слабым/дефолтным |
| `JWT_ACCESS_TTL` | `15m` | Срок жизни access-токена |
| `JWT_REFRESH_TTL` | `30d` | Срок жизни refresh-токена |
| `ENCRYPTION_KEY` | — | 32 байта hex (64 симв.) для AES-256-GCM шифрования реквизитов |
| `DEV_FAKE_AUTH` | `false` | `true` → доступен `POST /auth/dev` (только вне production) |
| `PORT` | `3000` | Порт API |

В production (`NODE_ENV=production`) сервер падает на старте, если `JWT_SECRET`
слабый/дефолтный или `ENCRYPTION_KEY` не 32 байта — см. `main.ts:assertSecrets`.

---

## Связанные документы

- [12-development.md](12-development.md) — как запускать, тестировать, добавлять API-домен (how-to)
- [13-getting-started.md](13-getting-started.md) — запуск с нуля (tutorial)
- [02-backend-spec.md](02-backend-spec.md) — замысел архитектуры бэкенда
- [04-frontend-spec.md](04-frontend-spec.md) — замысел Mini App
- [09-security.md](09-security.md) — модель угроз и контроли
