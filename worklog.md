# Worklog — TravelMate

Журнал работы для быстрого продолжения. Последнее обновление: 2026-06-18.

---

## TL;DR — где мы сейчас (2026-06-18, вечер)

**ПРОД ЖИВ: https://trip-radar.ru · бот @Share_trip_bot (Mini App).**
Полнофункциональный продукт развёрнут и работает в Telegram.

- **Фронт** (`app/`) — React+TS+Tailwind, все экраны на реальном API, Telegram SDK
  (initData-auth, safe-area инсеты, BackButton, haptics, фото/имя из TG).
- **Бэкенд** (`server/`) — NestJS+TypeORM+Postgres+Redis, все модули готовы (см. ниже).
- **Деплой** — VPS 78.17.126.240, Docker (api+db+redis) + Caddy (авто-TLS).
  Подробно — раздел «ДЕПЛОЙ (прод)» ниже.
- **Осталось:** перевыпуск BOT_TOKEN (в самом конце, по договорённости) + хвосты
  (приватный доступ к фото, settle-модель, пагинация).

### История фаз
- ✅ Документация (`docs/01..10`, `schema.sql`).
- ✅ Фаза 2 — бэкенд-скелет (auth/trips/activities/expenses/balance, IDOR, деньги).
- ✅ Фаза 3 — сшивка фронта с API (TanStack Query, все экраны).
- ✅ Фаза 1 — Telegram SDK.
- ✅ Деплой на VPS + все доп-модули + раунд багфиксов по живому тесту.

---

## Структура репозитория

```
Trip Share/
├ README.md                  индекс документации
├ worklog.md                 ← этот файл
├ schema.sql                 канонический DDL (PostgreSQL)
├ TG_MINIAPP_ARCHITECTURE.md потоки данных
├ docs/
│  ├ 01-product-concept.md   концепт, аудитория, фишки, roadmap (v1 = всё, v2 = приложение)
│  ├ 02-backend-spec.md      API, очереди, S3, realtime, бот-инициативы
│  ├ 03-database-schema.md   таблицы/поля/enum/индексы
│  ├ 04-frontend-spec.md     экраны, темизация, realtime, offline
│  ├ 05-expenses-and-settlements.md  ЯДРО ДЕНЕГ: валюты, округление, долги
│  ├ 06-access-control.md    матрица роль×действие×ресурс
│  ├ 07-auth.md              Telegram initData + JWT
│  ├ 09-security.md          модель угроз, OWASP-чеклист
│  └ 10-screens.md           карта ~30 экранов для дизайна
├ design/
│  ├ home-today.html         референс главной (палитра «Закат»)
│  └ home-palettes.html      переключатель 4 палитр
├ app/                       ФРОНТ (Vite + React + TS + Tailwind)
└ server/                    БЭКЕНД (NestJS + TypeORM + Postgres)
```
> Исходные PDF (`*.pdf`) в корне — устаревшие, контент перенесён в `docs/`. Можно удалить.

---

## Ключевые решения (чтобы не переобсуждать)

- **Один продукт = Telegram Mini App (v1).** Всё (OCR, авто-режим, AI Story,
  здоровье и т.д.) — в v1. Отдельное мобильное приложение (вход по телефону,
  контакты телефона) — **v2, позже**. Сейчас не проектируем.
- **Регистрация не нужна** — данные из Telegram `initData`.
- **Добавление людей** — через нативный share Telegram (Mini App НЕ читает список
  контактов — платформенное ограничение).
- **Дизайн-вектор: «дерзкий соц / Wrapped»** — тёмная база, сочные градиенты,
  жирная заглавная типографика (Unbounded + Hanken Grotesk). Пользователю зашло.
- **Палитра — фича.** 4 темы (Закат/Неон/Пастель/Кислота) + авто. Реализованы как
  **CSS-переменные (токены)** + `data-theme`. Хранится в `users.theme`.
- **Безопасность-приоритеты:** object-level авторизация (IDOR), шифрование
  `payment_details`, подписанные URL для фото/банк-скринов (в скелете заложена IDOR-защита).
- **Деньги:** центы, деление largest-remainder, greedy-минимизация переводов,
  идемпотентность по `Idempotency-Key` (ретрай одного плательщика, не «двое»).

---

## Фронт (`app/`) — статус

**Стек:** Vite, React 18, TypeScript, react-router, Tailwind + CSS-токены.

**Готово (~25 экранов):**
- Home (день/активности/момент/photo-prompt/долги — долги внизу).
- Trips (список, статусы), TripNew, Invite, Join, Splash.
- TripDetails с табами Обзор/Активности/Расходы/Фото/Итоги.
  - из бот-нав «Расходы» — таб-бар без «Фото»; «Фото» — без таб-бара (пропсы
    `excludeTabs` / `showTabs`).
- ActivityDetails (голосование/участники/комментарии), ActivityNew, ActivityComplete.
- ExpenseNew, ExpenseDetails, Receipt(OCR), Balance, Settle.
- Moment (N ракурсов), PhotoUpload, PhotoPrompt, Bingo.
- Wrapped (групповой + личный `/wrapped/me`).
- Profile (выбор палитры + настройки), ProfileEdit, NotificationSettings, HealthSettings.

**Файлы-ориентиры:**
- `src/index.css` — токены 4 палитр + классы компонентов.
- `src/theme.tsx` — провайдер палитры (localStorage).
- `src/data.ts` — МОК-данные (заменить на API в фазе 3). `tripList` + `getTrip(id)`.
- `src/ui.tsx` — общие компоненты (BottomNav, иконки, рамка, Toggle).
- `src/App.tsx` — роуты.

**Запуск:**
```bash
cd app && npm install && npm run dev   # http://localhost:5173
```

**Известные ограничения фронта:**
- Контент внутри табов Активности/Расходы/Фото — общий мок (не различается по
  поездкам). Шапка/участники/статус — уже свои у каждой поездки.
- Данные статичные (заглушки) — это задача фазы 3.

---

## Бэкенд (`server/`) — статус

**Стек:** NestJS 10, TypeORM 0.3, Postgres, @nestjs/jwt, class-validator.

**Готово:**
- **auth:** `POST /auth/telegram` (HMAC initData + TTL), `/auth/refresh`,
  `/auth/dev` (отладка), `GET /auth/me`.
- **users:** `GET/PATCH /users/me`, `GET /users/:id`.
- **trips:** CRUD, `/:id/invite`, `/:id/join`, `/:id/members`, `/:id/balance`.
- **activities:** `GET/POST /trips/:id/activities`, `GET /activities/:id`,
  `/:id/vote`, `/:id/complete`.
- **expenses:** `GET/POST /trips/:id/expenses` (+ `Idempotency-Key`), `/expenses/:id/settle`.
- **Безопасность:** глобальный `JwtAuthGuard` + `@Public()`; `MembershipService`
  (IDOR → 404 не-членам); `ValidationPipe` whitelist; деньги — `common/money.ts`.

**Файлы-ориентиры:**
- `src/common/telegram.ts` — валидация initData (HMAC + TTL).
- `src/common/membership.service.ts` — object-level авторизация.
- `src/common/money.ts` — split + минимизация переводов.
- `src/expenses/balance.service.ts` — расчёт баланса.
- `src/entities/` — 8 entities = `schema.sql`.

**Запуск:**
```bash
cd server && cp .env.example .env
docker compose up -d        # Postgres :5432 (нужен запущенный docker/colima!)
npm install && npm run start:dev   # http://localhost:3000/api/v1
```

**Dev-вход без Telegram** (`DEV_FAKE_AUTH=true`):
```bash
curl -X POST localhost:3000/api/v1/auth/dev -H 'content-type: application/json' \
  -d '{"firstName":"Никита"}'   # → { access, refresh, user }
```

**Проверено:** `nest build` зелёный; `common/money.js` юнит-прогон —
`10.00/3 = 3.34+3.33+3.33` (без потери), net = 0, переводы ≤ N−1.

**НЕ проверено:** полный HTTP-флоу — Docker daemon (colima) был выключен, Postgres
не поднялся. При запущенном docker всё должно подняться по инструкции выше.

---

## TODO — продолжение

### Фаза 3 — сшивка фронта с API
Сделано:
- [x] `app/src/api/client.ts` (токены, авто-refresh, MOCK-флаг по `VITE_API_URL`).
- [x] `app/src/api/endpoints.ts` (mock↔real, маппинг backend→frontend форм).
- [x] `app/src/api/queries.ts` (хуки) + QueryClientProvider в `main.tsx`.
- [x] `app/src/auth.tsx` (AuthProvider: dev-вход/`/auth/me` на старте).
- [x] Мигрированы: Trips, TripDetails (overview/activities/expenses), Balance,
      ExpenseNew (`Idempotency-Key` в `expenses.create`).

Дотянуто (вся фаза 3 по фронту):
- [x] Home (активности), ActivityDetails (`useVote`), ActivityNew/Complete (create/complete),
      TripNew (`POST /trips`), Invite (`POST /trips/:id/invite`), Profile (PATCH theme),
      ExpenseDetails (новый бэкенд `GET /expenses/:id`).
- [x] `useActiveTripId()` — активная поездка для bottom-nav экранов.
- [x] Бэкенд: добавлен `GET /expenses/:id` (детали + участники).

Осталось (хвосты, не блокеры):
- [ ] Прогнать **real-режим** против запущенного бэка: `VITE_API_URL=http://localhost:3000`
      (нужен docker/colima для Postgres) — проверить весь поток end-to-end.
- [ ] Settle: на бэке settle — по расходу, а баланс показывает агрегированные переводы;
      «честное» закрытие перевода требует доработки модели (сейчас в UI локально).
- [ ] Оптимистичные апдейты для vote; пагинация списков; контент по поездкам.

### Фаза 1 — Telegram SDK ✅ (через window.Telegram.WebApp)
- [x] `app/src/tg.ts` — обёртка (initData, BackButton, haptics, colorScheme), graceful вне TG.
- [x] Скрипт `telegram-web-app.js` в `index.html`.
- [x] Auth: в Telegram — `auth.telegram(initData)`, в браузере — `auth.dev()`.
- [x] Нативная BackButton (`TelegramChrome` в `App.tsx`) — показ/скрытие по роуту.
- [x] Тема по умолчанию из `colorScheme` (свет→pastel, тьма→sunset).
- [x] Haptics на голос/выбор палитры/создание расхода.
- [ ] (опц.) MainButton для форм; theme params (точные цвета) поверх палитр.
- [ ] Проверка в реальном Telegram (нужен задеплоенный https-фронт + бот).

### Хвосты/долги
- [ ] Раздельный контент по поездкам + пустые состояния (фронт).
- [ ] Бэкенд: trip_invites в БД (сейчас in-memory Map), refresh-ротация со стором,
      шифрование `payment_details`, подписанные URL для S3, пагинация списков.
- [ ] Удалить устаревшие `*.pdf` из корня.
- [ ] Определиться с именем: папка «Trip Share» vs «TravelMate».

---

## ДЕПЛОЙ (прод) — 2026-06-18

**Живой:** https://trip-radar.ru · бот **@Share_trip_bot** (кнопка меню → Mini App).

- **Сервер:** VPS 78.17.126.240, Ubuntu 22.04, 1 CPU / 2 ГБ. Был ISPmanager-хостинг —
  лишние сервисы (nginx/apache/mysql/exim/dovecot/pdns/proftpd/ispmanager) остановлены;
  nginx+apache **masked**. WireGuard-контейнер `amnezia-awg2` не тронут.
- **Стек:** всё в `/opt/travelmate/`:
  - `docker-compose.prod.yml` — Postgres + api (NestJS, Dockerfile в `server/`).
    api на `127.0.0.1:3000`, Postgres внутренний (том `travelmate_pgdata`).
  - Фронт — статика в `/opt/travelmate/web` (собран с `VITE_API_URL=https://trip-radar.ru`).
  - **Caddy** (`/usr/local/bin/caddy`, systemd `caddy.service`, `/etc/caddy/Caddyfile`):
    авто-TLS Let's Encrypt, `/api/*` → :3000, остальное → SPA-статика.
  - `.env` (chmod 600): BOT_TOKEN, JWT_SECRET, DB_PASSWORD (сгенерены), `DB_SYNCHRONIZE=true`,
    `DEV_FAKE_AUTH=true` (временно).
- **Проверено:** auth/dev → trip → expense → balance по https; TLS валиден; фронт отдаётся.

### Модули (статус)
- ✅ auth, users, trips, activities, expenses, balance.
- ✅ **memories (фото)** — upload (multer→диск `/opt/travelmate/uploads`, том), list,
  by-activity. Раздаётся Caddy как `/uploads/*`. Таблица `memories` создана вручную
  (synchronize off). Storage на диске (S3 — потом). EXIF-стрип не делается (TODO).
- ✅ **комментарии** — `GET/POST /activities/:id/comments`, таблица `activity_comments`.
  Подключены в ActivityDetails. Проверено e2e.
- ✅ **уведомления** — BullMQ+Redis (воркер в api-процессе), `TelegramBotService`,
  напоминания за 24ч/2ч планируются при создании активности. Проверено e2e
  (задача в Redis → воркер → Telegram send). Caveat: пользователь должен нажать
  Start у бота, иначе sendMessage = 403.
- ✅ **summary/wrapped** — `GET /trips/:id/summary` (агрегаты из БД), Wrapped и
  summary-таб на реальных числах. Проверено e2e.
- ✅ **OCR чеков** — `POST /trips/:id/receipt-ocr`, Tesseract 5 (rus+eng) в образе,
  эвристический парсинг позиций+итога, Receipt-экран на реальном OCR. Проверено e2e
  (синтетический чек → 4 позиции + total 63.50 распознаны верно).
- ✅ **bingo через фото** — `GET /trips/:id/bingo`, `POST /…/bingo/:key/photo` (загрузка
  фото в клетку), `DELETE /…/bingo/:key`. Таблица `bingo_marks` (+ `photoUrl`). Клетка
  показывает загруженное фото.
- ✅ **EXIF-стрип + ре-энкод** — общий хелпер `common/image-store.ts` (sharp → jpeg,
  вырезает гео; fallback оригинал). Используют memories и bingo.
- ✅ **Шифрование payment_details** — AES-256-GCM (`ENCRYPTION_KEY` в .env), в БД
  `enc:v1:…`, расшифровка только владельцу, из публичного профиля реквизиты убраны.
- Все продуктовые стабы закрыты. Прод-стек: api + db + redis (Docker), Caddy (TLS),
  всё в /opt/travelmate.

### UI/UX фиксы (по скриншотам из Telegram)
- ✅ Убран фейковый статус-бар макета (наезжал на системный).
- ✅ Top-инсет под чроме Telegram: `tg.applyInsets()` ставит `--tg-top` из
  `safeAreaInset+contentSafeAreaInset` (мин. 96px в TG) → шапка не под кнопками
  «Закрыть/⋯». Подписка на `safeAreaChanged/contentSafeAreaChanged`.
- ✅ В Telegram скрыта дублирующая in-app кнопка «назад» (есть нативная).
- ✅ Онбординг при первом запуске (3 слайда, флаг `tm_onboarded` в localStorage).

### Раунд багфиксов по живому тесту (КЛЮЧЕВОЕ)
- 🐛 **Корневой баг авторизации:** в `api/client.ts` авто-refresh токена пропускался
  для ВСЕХ `/auth/*`, включая `/auth/me` → после протухания access (15м) профиль не
  грузился (имя/аватар = fallback «путешественник»/«Участник»), а `/trips` работал
  (отсюда «видны поездки, но нет имени»). **Фикс:** refresh исключён только для
  токен-выдающих (`/auth/refresh|telegram|dev`), `/auth/me` рефрешится.
- ✅ **Имя/аватар из Telegram:** `tg.user` (`initDataUnsafe.user`) — настоящие
  `first_name` + `photo_url` (.jpg), т.к. в БД `avatarUrl` часто `.svg`-заглушка.
  AuthProvider мгновенно показывает данные TG, мержит с `/me`. Компонент `ui.Av`
  (фото или буква). Участники — с аватарами (`usersFor` кэширует name+initial+avatar).
- ✅ **Сохранение профиля:** ProfileEdit реально шлёт `PATCH /users/me`
  (имя+реквизиты) + `refresh()`. `useUpdateProfile`.
- ✅ **Фоновая+сжатая загрузка фото** (`lib/image.ts` сжатие canvas ≤1600/0.7,
  `lib/uploads.ts` оптимистичный предпросмотр + загрузка в фоне) — можно уходить с
  экрана, фото не теряется. Применено к memories и bingo.
- ✅ **Убран мок-контент:** Invite показывал фейковых Аню/Макса — теперь реальные
  участники из API.
- 🧹 **Чистка битых данных:** мои прошлые `TRUNCATE` оставили поездки-сироты (owner/
  members на удалённых юзерах → «Участник»). Удалены, осталась 1 валидная.
  **ВАЖНО на будущее:** не делать `TRUNCATE users` без чистки trips/trip_members.

### Осталось (не критично, на будущее)
- [ ] **Перевыпустить BOT_TOKEN** (по договорённости — в самом конце).
- [ ] Приватный доступ к фото: сейчас `/uploads/*` отдаётся открыто (random-UUID,
      security-by-obscurity). Полный auth-gated доступ / signed URL — TODO.
- [ ] Settle-модель (закрытие агрегированного перевода), пагинация списков.
- [ ] schema.sql (snake_case) ↔ entities (camelCase) свести для будущих миграций.

### Управление
```bash
ssh root@78.17.126.240
cd /opt/travelmate
docker compose -f docker-compose.prod.yml ps          # статус
docker compose -f docker-compose.prod.yml logs -f api  # логи
docker compose -f docker-compose.prod.yml up -d --build # передеплой бэка
systemctl reload caddy                                  # перечитать Caddyfile
```
Обновить фронт: локально `VITE_API_URL=https://trip-radar.ru npm run build`,
затем `rsync -az --delete app/dist/ root@78.17.126.240:/opt/travelmate/web/`.

### ⚠️ Перед публичным запуском
- [x] `DEV_FAKE_AUTH=false` (сделано; включается временно только под e2e-тесты, потом обратно).
- [x] `DB_SYNCHRONIZE=false` (сделано; новые таблицы создаём вручную `CREATE TABLE ... "camelCase"`).
- [x] Шифрование `payment_details` (сделано, `ENCRYPTION_KEY` в .env).
- [ ] **Перевыпустить BOT_TOKEN** (светился в чате) — ПОСЛЕДНИЙ шаг по договорённости:
      новый в @BotFather → `.env` → `docker compose up -d` → пере-`setChatMenuButton`.
- [ ] Приватный доступ к фото (signed URL / auth-gate) — пока открыто по random-UUID.

### Заметки на будущее
- **Кэш Telegram:** Mini App кэшируется агрессивно. После деплоя фронта — закрыть
  (смахнуть) и переоткрыть; упрямый кэш чистится в Настройки→Данные→Очистить кэш.
- **e2e на проде:** тестировал так — временно `DEV_FAKE_AUTH=true`, `/auth/dev` →
  curl, в конце `TRUNCATE` ТОЛЬКО dev-данных (по id dev-юзера, не всё подряд!) и
  `DEV_FAKE_AUTH=false`.
- **БД-колонки camelCase** (TypeORM synchronize создал так): запросы — через
  `"telegramId"`, `"firstName"`, `"ownerId"` и т.п. (не snake_case из schema.sql).

## Быстрый старт «с нуля» в новой сессии
```bash
# фронт
cd app && npm install && npm run dev
# бэк (нужен docker/colima)
cd server && cp .env.example .env && docker compose up -d && npm install && npm run start:dev
```
Дальше открой этот файл и раздел «TODO → Фаза 3».
