# Database Schema (PostgreSQL)

Исполняемый DDL — в [../schema.sql](../schema.sql). Здесь — описание и обоснование.

## Соглашения

- PK — `UUID` (`gen_random_uuid()`), кроме `users.telegram_id` (естественный ключ).
- Деньги — `NUMERIC(14,2)` (фиксированная точность; правила округления — в
  [05-expenses-and-settlements](05-expenses-and-settlements.md#округление)).
- Валюта — `CHAR(3)` (ISO 4217).
- Все временные метки — `TIMESTAMPTZ`, `DEFAULT now()`.
- Перечисления — нативные `ENUM`-типы Postgres.
- FK с `ON DELETE CASCADE` для дочерних записей поездки, `RESTRICT` — где удаление
  должно блокироваться (например, нельзя удалить пользователя с открытыми долгами).

## ENUM-типы

| Тип | Значения |
|-----|----------|
| `trip_type` | `flight`, `car`, `train`, `bus`, `other` |
| `trip_status` | `planning`, `active`, `finished` |
| `member_role` | `owner`, `admin`, `member` |
| `activity_status` | `proposed`, `confirmed`, `completed`, `cancelled` |
| `vote_value` | `going`, `not_going` |
| `expense_category` | `activity`, `restaurant`, `transport`, `fuel`, `parking`, `toll`, `accommodation`, `shopping`, `other` |
| `split_mode` | `equal`, `passengers_only`, `manual` |
| `settlement_status` | `pending`, `settled` |
| `memory_phase` | `before_activity`, `during_activity`, `after_activity`, `before_trip`, `after_trip` |
| `receipt_ocr_status` | `pending`, `processing`, `done`, `failed` |

## Таблицы

### users
| Поле | Тип | Заметки |
|------|-----|---------|
| id | UUID PK | |
| telegram_id | BIGINT UNIQUE NOT NULL | естественный ключ Telegram |
| username | VARCHAR | nullable |
| first_name | VARCHAR | |
| avatar_url | TEXT | |
| payment_details | TEXT | реквизиты для переводов *(добавлено)* |
| theme | VARCHAR(16) DEFAULT 'sunset' | палитра оформления: `sunset`/`neon`/`pastel`/`acid`/`auto` *(добавлено)* |
| notification_settings | JSONB DEFAULT '{}' | *(добавлено)* |
| health_settings | JSONB | nullable, opt-in *(добавлено)* |
| created_at | TIMESTAMPTZ | |

### trips
| Поле | Тип | Заметки |
|------|-----|---------|
| id | UUID PK | |
| title | VARCHAR NOT NULL | |
| description | TEXT | |
| trip_type | trip_type | |
| status | trip_status DEFAULT 'planning' | *(добавлено)* |
| base_currency | CHAR(3) NOT NULL | валюта для сведения баланса *(добавлено)* |
| start_date | DATE | |
| end_date | DATE | |
| owner_id | UUID FK→users RESTRICT | |
| created_at | TIMESTAMPTZ | |

### trip_members
| Поле | Тип | Заметки |
|------|-----|---------|
| id | UUID PK | |
| trip_id | UUID FK→trips CASCADE | |
| user_id | UUID FK→users CASCADE | |
| role | member_role DEFAULT 'member' | |
| joined_at | TIMESTAMPTZ | |
| | UNIQUE(trip_id, user_id) | один участник — одна запись |

### trip_invites *(добавлено)*
Управляемые приглашения вместо «магического» join.
| Поле | Тип | Заметки |
|------|-----|---------|
| id | UUID PK | |
| trip_id | UUID FK→trips CASCADE | |
| token | VARCHAR UNIQUE NOT NULL | |
| created_by | UUID FK→users | |
| expires_at | TIMESTAMPTZ | |
| max_uses | INTEGER | nullable |
| uses | INTEGER DEFAULT 0 | |

### activities
| Поле | Тип | Заметки |
|------|-----|---------|
| id | UUID PK | |
| trip_id | UUID FK→trips CASCADE | |
| creator_id | UUID FK→users | |
| title | VARCHAR NOT NULL | |
| description | TEXT | |
| activity_url | TEXT | |
| price | NUMERIC(14,2) | nullable (может быть неизвестна заранее) |
| currency | CHAR(3) | |
| start_time | TIMESTAMPTZ | |
| end_time | TIMESTAMPTZ | |
| status | activity_status DEFAULT 'proposed' | |
| created_at | TIMESTAMPTZ | |

### activity_participants *(добавлено)*
Состав участников активности (отдельно от голосов).
| Поле | Тип | Заметки |
|------|-----|---------|
| id | UUID PK | |
| activity_id | UUID FK→activities CASCADE | |
| user_id | UUID FK→users CASCADE | |
| | UNIQUE(activity_id, user_id) | |

### activity_votes
| Поле | Тип | Заметки |
|------|-----|---------|
| id | UUID PK | |
| activity_id | UUID FK→activities CASCADE | |
| user_id | UUID FK→users CASCADE | |
| vote | vote_value | |
| created_at | TIMESTAMPTZ | |
| | UNIQUE(activity_id, user_id) | один голос на участника (upsert) |

### activity_comments *(добавлено)*
| Поле | Тип | Заметки |
|------|-----|---------|
| id | UUID PK | |
| activity_id | UUID FK→activities CASCADE | |
| user_id | UUID FK→users | |
| body | TEXT NOT NULL | |
| created_at | TIMESTAMPTZ | |

### expenses
| Поле | Тип | Заметки |
|------|-----|---------|
| id | UUID PK | |
| trip_id | UUID FK→trips CASCADE | |
| activity_id | UUID FK→activities SET NULL | nullable, если расход привязан к активности *(добавлено)* |
| payer_id | UUID FK→users RESTRICT | |
| title | VARCHAR | |
| amount | NUMERIC(14,2) NOT NULL | |
| currency | CHAR(3) NOT NULL | |
| exchange_rate | NUMERIC(18,8) | курс к base_currency на дату *(добавлено)* |
| category | expense_category | |
| split_mode | split_mode DEFAULT 'equal' | *(добавлено)* |
| idempotency_key | VARCHAR | для защиты от дублей *(добавлено)* |
| created_at | TIMESTAMPTZ | |
| | UNIQUE(payer_id, idempotency_key) | |

### expense_participants
| Поле | Тип | Заметки |
|------|-----|---------|
| id | UUID PK | |
| expense_id | UUID FK→expenses CASCADE | |
| user_id | UUID FK→users CASCADE | |
| amount | NUMERIC(14,2) NOT NULL | доля участника |
| status | settlement_status DEFAULT 'pending' | признак оплаты *(добавлено)* |
| settled_at | TIMESTAMPTZ | nullable *(добавлено)* |
| | UNIQUE(expense_id, user_id) | |

### receipts
| Поле | Тип | Заметки |
|------|-----|---------|
| id | UUID PK | |
| expense_id | UUID FK→expenses CASCADE | |
| file_url | TEXT | |
| ocr_status | receipt_ocr_status DEFAULT 'pending' | |
| created_at | TIMESTAMPTZ | |

### receipt_items
| Поле | Тип | Заметки |
|------|-----|---------|
| id | UUID PK | |
| receipt_id | UUID FK→receipts CASCADE | |
| name | VARCHAR | |
| quantity | INTEGER | |
| price | NUMERIC(14,2) | |

### memories
| Поле | Тип | Заметки |
|------|-----|---------|
| id | UUID PK | |
| trip_id | UUID FK→trips CASCADE | |
| activity_id | UUID FK→activities SET NULL | nullable |
| user_id | UUID FK→users | автор |
| photo_url | TEXT | |
| memory_phase | memory_phase | заменяет свободный `memory_type` *(уточнено)* |
| taken_at | TIMESTAMPTZ | время съёмки — важно для таймлайна/Story *(добавлено)* |
| created_at | TIMESTAMPTZ | время загрузки |

### settlements *(переименовано из balances)*
Рассчитанный план «кто кому переводит» (результат оптимизации долгов).
| Поле | Тип | Заметки |
|------|-----|---------|
| id | UUID PK | |
| trip_id | UUID FK→trips CASCADE | |
| from_user | UUID FK→users | |
| to_user | UUID FK→users | |
| amount | NUMERIC(14,2) | в base_currency |
| status | settlement_status DEFAULT 'pending' | |
| updated_at | TIMESTAMPTZ | |

### notifications
| Поле | Тип | Заметки |
|------|-----|---------|
| id | UUID PK | |
| user_id | UUID FK→users CASCADE | |
| type | VARCHAR | |
| payload | JSONB | |
| sent_at | TIMESTAMPTZ | nullable до отправки |

### summaries
| Поле | Тип | Заметки |
|------|-----|---------|
| id | UUID PK | |
| trip_id | UUID FK→trips CASCADE | |
| summary_json | JSONB | |
| generated_at | TIMESTAMPTZ | |
| | UNIQUE(trip_id) | один summary на поездку |

## Рекомендуемые индексы

- `trip_members(user_id)` — список поездок пользователя.
- `activities(trip_id, start_time)` — лента и календарь.
- `expenses(trip_id, created_at)` — лента расходов.
- `expense_participants(user_id, status)` — «мои неоплаченные долги».
- `memories(trip_id, taken_at)` — таймлайн.
- `notifications(user_id, sent_at)` — очередь доставки.
