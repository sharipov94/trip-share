# Архитектура Telegram Mini App

Высокоуровневые потоки данных. Детали — в [docs/](docs/).

## Общая схема

```
Frontend (Telegram Mini App)
        │  Telegram SDK
        ▼
   Backend API (NestJS)
        │
        ▼
   PostgreSQL · Redis · S3
```

## Авторизация

```
Telegram User → Mini App → initData → Backend Validation → JWT → API Access
```

Подробно: [docs/07-auth.md](docs/07-auth.md).

## Фото

```
User → Mini App Upload → Backend → S3 → CDN URL → Database
```

Загрузка с лимитами размера/типа и стрипом EXIF — см.
[docs/02-backend-spec.md](docs/02-backend-spec.md#хранилище-s3).

## Напоминания

```
Activity Created → BullMQ Job → Scheduler → Telegram Bot API → Push Message
```

Очереди и идемпотентность задач — см.
[docs/02-backend-spec.md](docs/02-backend-spec.md#фоновые-задачи-bullmq).

## Генерация Summary

```
Trip Finished → Summary Queue → Statistics Service → Photo Service
             → Summary Generator → summary_json → Frontend Rendering
```

## Реалтайм

WebSocket-комната `trip:{id}`; события синхронизируют состояние группы. Подробно:
[docs/02-backend-spec.md](docs/02-backend-spec.md#реалтайм) и
[docs/04-frontend-spec.md](docs/04-frontend-spec.md#реалтайм).
