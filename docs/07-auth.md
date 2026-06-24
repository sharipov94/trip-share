# Authentication — Telegram initData + JWT

**Регистрация не требуется.** Единственный способ входа в Mini App — Telegram: данные
пользователя (id, имя, аватар) берутся из `initData`, учётка создаётся автоматически при
первом входе.

> **Будущая фаза.** Отдельное мобильное приложение добавит вход по номеру телефона
> (OTP) с тем же JWT-механизмом и линковкой аккаунтов по верифицированному телефону.
> Сейчас не проектируем — фокус на Mini App.

## Поток

```
Telegram User → Mini App → initData → Backend Validation → JWT → API Access
```

1. Mini App получает `initData` из Telegram SDK.
2. Клиент отправляет его на `POST /auth/telegram`.
3. Бэкенд **валидирует подпись** `initData`, находит/создаёт пользователя.
4. Бэкенд выдаёт пару токенов: короткоживущий `access` (JWT) + `refresh`.

## Валидация initData (критично)

`initData` — это query-строка, подписанная ботом. Проверка обязательна, иначе любой
может подделать `telegram_id`.

Алгоритм (по документации Telegram):

1. Распарсить `initData`, извлечь поле `hash`, остальные пары отсортировать по ключу.
2. Сформировать `data_check_string` (пары `key=value`, разделённые `\n`).
3. `secret_key = HMAC_SHA256(key="WebAppData", data=BOT_TOKEN)`.
4. `computed = HMAC_SHA256(key=secret_key, data=data_check_string)` в hex.
5. Сравнить `computed` с `hash` (constant-time сравнение).
6. **Проверить `auth_date`**: если старше TTL (например, 24 часа) — отклонить
   (защита от replay).

`BOT_TOKEN` хранится только на бэкенде (env / секрет-менеджер), никогда не попадает
на клиент.

## Токены

| Токен | TTL | Хранение | Назначение |
|-------|-----|----------|-----------|
| `access` (JWT) | 15 мин | в памяти клиента | `Authorization: Bearer` на все запросы |
| `refresh` | 30 дней | httpOnly / Telegram CloudStorage | обновление access |

- **JWT payload:** `sub` (user UUID), `tg` (telegram_id), `iat`, `exp`. Подпись —
  `RS256` или `HS256` с секретом из env.
- **Ротация refresh:** при `POST /auth/refresh` старый refresh инвалидируется,
  выдаётся новый (refresh token rotation). Хранить хэш активного refresh-токена в
  Redis/БД для возможности отзыва.
- **Logout** (`POST /auth/logout`) — удаляет активный refresh из хранилища.

## Эндпоинты

| Метод | Путь | Тело / Заметки |
|-------|------|----------------|
| POST | `/auth/telegram` | `{ initData }` → `{ access, refresh, user }` |
| POST | `/auth/refresh` | `{ refresh }` → новая пара токенов |
| POST | `/auth/logout` | инвалидация refresh |
| GET | `/auth/me` | текущий пользователь по access-токену |

## Прочее

- Rate-limit на `/auth/*` (через Redis) — защита от перебора.
- Все эндпоинты только по HTTPS.
- При первом входе создаётся запись `users` с данными из `initData.user`
  (telegram_id, username, first_name, avatar_url).
