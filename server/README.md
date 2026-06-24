# TravelMate — Backend (NestJS)

Скелет API по [`../docs/02-backend-spec.md`](../docs/02-backend-spec.md). Реализованы:
auth (валидация Telegram initData + JWT), users, trips (+ инвайты/участники),
activities (+ голосование), expenses (+ деление, идемпотентность), баланс с
минимизацией переводов.

## Запуск

```bash
cd server
cp .env.example .env          # заполни BOT_TOKEN при наличии
docker compose up -d          # поднимет Postgres на :5432
npm install
npm run start:dev             # http://localhost:3000/api/v1
```

С `DB_SYNCHRONIZE=true` таблицы создаются из entities автоматически (только dev).
В проде — применяй [`../schema.sql`](../schema.sql) и выключай synchronize.

## Локальная отладка без Telegram

Получить реальный `initData` вне Telegram нельзя, поэтому для разработки есть
dev-вход (включается `DEV_FAKE_AUTH=true`):

```bash
curl -X POST localhost:3000/api/v1/auth/dev \
  -H 'content-type: application/json' -d '{"firstName":"Никита"}'
# → { access, refresh, user }
```

Дальше используй `Authorization: Bearer <access>` для остальных запросов.

> ⚠️ `auth/dev` — **только для разработки**, в проде отключён.

## Эндпоинты (основное)

| Метод | Путь | |
|-------|------|--|
| POST | `/auth/telegram` | вход по initData |
| POST | `/auth/refresh` · `/auth/dev` | refresh / dev-вход |
| GET/PATCH | `/users/me` | профиль |
| POST/GET | `/trips` | создать / список |
| GET/DELETE | `/trips/:id` | детали / удалить |
| POST | `/trips/:id/invite` · `/trips/:id/join` | инвайт / вступить |
| GET | `/trips/:id/balance` | баланс + план переводов |
| GET/POST | `/trips/:id/activities` | список / создать |
| POST | `/activities/:id/vote` · `/complete` | голос / завершить |
| GET/POST | `/trips/:id/expenses` | список / создать (`Idempotency-Key`) |
| POST | `/expenses/:id/settle` | отметить оплаченным |

## Безопасность (реализовано в скелете)

- Валидация `initData`: HMAC + TTL ([common/telegram.ts](src/common/telegram.ts)).
- Глобальный `JwtAuthGuard`; публичные роуты — `@Public()`.
- `MembershipService` — object-level авторизация (IDOR): доступ к ресурсам поездки
  только участникам; не-член получает 404.
- `ValidationPipe` whitelist + forbidNonWhitelisted (защита от mass assignment).
- Идемпотентность создания расхода по `Idempotency-Key`.
- Деньги в центах, деление largest-remainder, greedy-минимизация переводов
  ([common/money.ts](src/common/money.ts)).
