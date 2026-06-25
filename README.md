# TravelMate

> Рабочее название. Папка проекта называется `Trip Share` — нужно зафиксировать единое имя до старта кода.

**TravelMate** — Telegram Mini App для совместных путешествий, который сопровождает группу друзей на всех этапах поездки:

```
Планирование → Путешествие → Расходы → Воспоминания
```

В отличие от Splitwise/TripIt, продукт не ограничивается учётом расходов или
маршрутом — это единое пространство группы во время путешествия, с главной
фишкой **Travel Story** (автоматический цифровой дневник поездки).

## Документация

| Документ | Содержание |
|----------|------------|
| [docs/01-product-concept.md](docs/01-product-concept.md) | Продуктовый концепт, аудитория, сценарии, сущности, дорожная карта |
| [docs/02-backend-spec.md](docs/02-backend-spec.md) | Архитектура бэкенда, REST API, фоновые задачи, хранилище |
| [docs/03-database-schema.md](docs/03-database-schema.md) | Схема БД: таблицы, поля, enum, FK, индексы |
| [docs/04-frontend-spec.md](docs/04-frontend-spec.md) | Telegram Mini App: экраны, навигация, реалтайм, оффлайн |
| [docs/05-expenses-and-settlements.md](docs/05-expenses-and-settlements.md) | **Ядро продукта:** валюты, округление, долги, минимизация переводов |
| [docs/06-access-control.md](docs/06-access-control.md) | Матрица доступа: роль × действие × ресурс |
| [docs/07-auth.md](docs/07-auth.md) | Авторизация через Telegram initData, JWT, refresh |
| [docs/09-security.md](docs/09-security.md) | Модель угроз, контроли (OWASP), защита PII и денег |
| [docs/10-screens.md](docs/10-screens.md) | Карта экранов (~30) с элементами и состояниями — для дизайна/Stitch |
| [TG_MINIAPP_ARCHITECTURE.md](TG_MINIAPP_ARCHITECTURE.md) | Высокоуровневые потоки данных |
| [schema.sql](schema.sql) | Исполняемый DDL (PostgreSQL) |

**Документация по коду** (как он реализован):

| Документ | Содержание |
|----------|------------|
| [docs/11-code-architecture.md](docs/11-code-architecture.md) | Фактическая структура `app/` и `server/`, npm-скрипты, переменные окружения |
| [docs/12-development.md](docs/12-development.md) | How-to: MOCK/реальный backend, dev-вход, тесты/lint, добавление API-домена |
| [docs/13-getting-started.md](docs/13-getting-started.md) | Tutorial: запуск полного стека с нуля |
| [docs/14-deployment.md](docs/14-deployment.md) | Деплой в прод (trip-radar.ru): `./deploy.sh`, Caddy, откат |

## Технологический стек

**Backend:** Node.js · NestJS · PostgreSQL · Redis · BullMQ · S3 · Docker
**Frontend:** React · TypeScript · Telegram SDK · TanStack Query · Zustand · Tailwind

## Быстрый старт

```bash
cd app && npm install && npm run dev   # фронт на заглушках, без бэкенда
```

Открой `http://localhost:5173`. Полный стек (с API и базой) — в
[docs/13-getting-started.md](docs/13-getting-started.md).

## Статус

Работающий MVP-прототип. Реализованы оба пакета: фронт (`app/`, ~30 экранов,
MOCK-режим + интеграция с API) и бэкенд (`server/`, NestJS: auth, trips, expenses
с минимизацией переводов, activities, memories, bingo, receipts-OCR). Продукт —
Telegram Mini App (v1); отдельное мобильное приложение — v2. Рекомендуемый порядок
дальнейшей реализации — см. «Дальнейшие шаги» в
[docs/01-product-concept.md](docs/01-product-concept.md).

---

> Исходные спецификации в формате PDF (`*.pdf`) сохранены в корне репозитория.
> После сверки их можно удалить — весь контент перенесён в Markdown и расширен.
