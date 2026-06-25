# How-to: разработка

Практические рецепты для частых задач. Предполагается, что репозиторий склонирован
и установлены Node 22+ и npm. Если запускаешь впервые — начни с
[13-getting-started.md](13-getting-started.md).

---

## Как запустить фронт без бэкенда (MOCK-режим)

Фронт умеет работать на заглушках — удобно для UI-разработки без поднятия сервера.

```bash
cd app
npm install
npm run dev
```

Открой адрес из консоли (обычно `http://localhost:5173`). Пустой `VITE_API_URL`
включает MOCK: данные берутся из `src/mocks/data.ts`, сеть не используется.

**Проверка:** экраны открываются, видны мок-поездки («Барселона 2027» и др.). В
DevTools → Network нет запросов к `/api/v1`.

---

## Как подключить фронт к реальному бэкенду

```bash
cd app
cp .env.example .env
```

В `.env` задай адрес сервера:

```
VITE_API_URL=http://localhost:3000
```

Перезапусти `npm run dev`. Теперь `MOCK` выключен (`src/api/client.ts`), запросы
идут на `http://localhost:3000/api/v1`.

**Проверка:** в Network видны запросы к `/api/v1/...`; без поднятого сервера экраны
покажут пустые состояния.

---

## Как поднять бэкенд локально

```bash
cd server
cp .env.example .env          # заполни BOT_TOKEN, если есть
docker compose up -d          # Postgres на :5432
npm install
npm run start:dev             # http://localhost:3000/api/v1
```

`DB_SYNCHRONIZE=true` создаёт таблицы из entities автоматически (только dev). В
проде применяй `schema.sql` и выключай synchronize.

**Проверка:**

```bash
curl http://localhost:3000/api/v1/trips
# → 401 (нет токена) — значит API живой и guard работает
```

### Troubleshooting

- **Сервер падает на старте с `[security] JWT_SECRET ...`** — в dev это
  предупреждение, не ошибка; запуск продолжается. В production это намеренный
  отказ: задай сильный `JWT_SECRET` (32+ симв.) и `ENCRYPTION_KEY` (64 hex).
- **`ENCRYPTION_KEY должен быть 32 байта`** — сгенерируй: `openssl rand -hex 32`.
- **`docker compose` не поднимает БД** — проверь, что порт 5432 свободен.

---

## Как залогиниться без Telegram (dev-вход)

Реальный `initData` вне Telegram получить нельзя. Для локальной отладки есть
dev-вход — он работает только при `DEV_FAKE_AUTH=true` **и** вне production.

```bash
curl -X POST localhost:3000/api/v1/auth/dev \
  -H 'content-type: application/json' -d '{"firstName":"Никита"}'
# → { access, refresh, user }
```

Дальше передавай `Authorization: Bearer <access>` в остальных запросах:

```bash
curl localhost:3000/api/v1/users/me -H "authorization: Bearer <access>"
```

> ⚠️ `POST /auth/dev` — полный обход аутентификации. В production отключён
> жёстко (гейт по `NODE_ENV`), даже если флаг включён. Никогда не ставь
> `DEV_FAKE_AUTH=true` в проде.

---

## Как прогнать проверки качества

В каждом пакете отдельно:

```bash
cd app      # или cd server
npm run lint        # ESLint
npm test            # юнит-тесты
npm run build       # сборка (включает проверку типов)
```

Те же три шага гоняет CI на каждый push/PR (`.github/workflows/ci.yml`) по матрице
`app` × `server`. Зелёный CI = все три прошли в обоих пакетах.

**Известные warning'и (не ошибки):** во фронте остаются 4 `react-hooks/set-state-in-effect` —
это намеренный паттерн инициализации форм из async-данных, помечен в `app/eslint.config.js`.

---

## Как добавить новый API-домен во фронте

Слой данных разнесён по доменам (`app/src/api/<domain>.ts`). Чтобы добавить новый
(например `polls`):

1. **Создай доменный файл** `app/src/api/polls.ts`:

   ```ts
   import { api, MOCK } from './client'
   import { wait } from './_internal'
   import * as mock from '../mocks/data'

   export const polls = {
     async list(tripId: string) {
       if (MOCK) return wait(mock.polls)
       return api(`/trips/${tripId}/polls`)
     },
   }
   ```

   Общие хелперы (кэш участников, `namesFor`) бери из `./_internal`. Мок-данные
   добавь в `src/mocks/data.ts`.

2. **Добавь React Query хук** в `app/src/api/queries.ts`:

   ```ts
   import { polls } from './polls'

   export const usePolls = (tripId: string) =>
     useQuery({ queryKey: ['polls', tripId], queryFn: () => polls.list(tripId), enabled: !!tripId })
   ```

3. **Используй хук в экране** — `const { data } = usePolls(tripId)`.

**Проверка:** `npm run build` в `app/` проходит без ошибок типов.

---

## Как добавить новый модуль в бэкенд

Следуй модульной структуре NestJS (см. [11-code-architecture.md](11-code-architecture.md)):

1. Папка `server/src/polls/` с `polls.module.ts`, `polls.controller.ts`,
   `polls.service.ts`, `dto/`.
2. Защити доступ к ресурсу через `MembershipService.assertMember(userId, tripId)`
   в сервисе (грузи ресурс по id, потом проверяй членство по его `tripId`).
3. Подключи модуль в `app.module.ts`.
4. DTO с `class-validator` — глобальный `ValidationPipe({ whitelist, forbidNonWhitelisted })`
   отбросит лишние поля (защита от mass assignment).

**Проверка:** `npm run build` и `npm test` в `server/` проходят.

---

## Связанные документы

- [11-code-architecture.md](11-code-architecture.md) — структура кода, скрипты, env (reference)
- [13-getting-started.md](13-getting-started.md) — первый запуск с нуля (tutorial)
- [07-auth.md](07-auth.md) — как устроена авторизация
