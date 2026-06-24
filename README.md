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

## Технологический стек

**Backend:** Node.js · NestJS · PostgreSQL · Redis · BullMQ · S3 · Docker
**Frontend:** React · TypeScript · Telegram SDK · TanStack Query · Zustand · Tailwind

## Статус

Стадия проектирования. Кода ещё нет. Весь продукт строится как Telegram Mini App
(v1); отдельное мобильное приложение — v2, после запуска Mini App. Рекомендуемый
порядок реализации — см. раздел «Дальнейшие шаги» в
[docs/01-product-concept.md](docs/01-product-concept.md).

---

> Исходные спецификации в формате PDF (`*.pdf`) сохранены в корне репозитория.
> После сверки их можно удалить — весь контент перенесён в Markdown и расширен.
