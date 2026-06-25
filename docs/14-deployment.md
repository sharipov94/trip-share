# Деплой

Как TravelMate развёрнут в продакшене и как выкатить новую версию.

## Где живёт прод

- **Домен:** https://trip-radar.ru (TLS выпускает Caddy автоматически)
- **Сервер:** VPS, каталог `/opt/travelmate`. Адрес/порт — в gitignored `deploy.env` (см. `deploy.env.example`)
- **Reverse-proxy:** системный Caddy, [`/etc/caddy/Caddyfile`](../Caddyfile) (копия в репо)

Раскладка `/opt/travelmate` на сервере:

```
web/                  собранный фронт (app/dist) — Caddy отдаёт как SPA
server/               исходники бэка — собираются в образ travelmate-api
uploads/              загруженные фото
.env                  реальные секреты (НЕ в git)
docker-compose.prod.yml   db (postgres) + redis + api
```

Caddy маршрутизирует: `/api/*` → `127.0.0.1:3000` (NestJS), `/uploads/*` и
`/assets/*` — с диска, остальное → `index.html` (SPA). Контейнер API стартует с
`NODE_ENV=production`.

## Как выкатить новую версию

Из корня репозитория:

```bash
./deploy.sh
```

Скрипт делает: собирает фронт с `VITE_API_URL=https://trip-radar.ru` → бэкапит
`web/` и текущий образ как `:rollback` → rsync'ит `web/` и `server/` → пересобирает
и перезапускает API → прунит образы → смоук-тест (ожидаем `200` на главной и `401`
на `/api/v1/trips`).

Переопределить сервер: `DEPLOY_HOST=root@1.2.3.4 ./deploy.sh`.

> **Важно:** пустой `VITE_API_URL` собрал бы фронт в MOCK-режиме (заглушки). Скрипт
> всегда подставляет прод-URL — не запускай `npm run build` для прода вручную без него.

## Откат

Скрипт печатает команду отката в конце. Вручную:

```bash
# $DEPLOY_HOST берётся из deploy.env
ssh "$DEPLOY_HOST" 'cd /opt/travelmate && rm -rf web && mv web.bak web && \
  docker tag travelmate-api:rollback travelmate-api:latest && \
  docker compose -f docker-compose.prod.yml up -d api'
```

## Чего нельзя протестировать вне Telegram

Это Telegram Mini App: реальный логин по `initData` доступен только внутри
Telegram (бот **@Share_trip_bot**). В обычном браузере приложение пробует dev-вход,
получает `403` (в проде он закрыт) и показывает degraded-состояние — это ожидаемо.
Полный UX-тест — только из Telegram.

## Связанные документы

- [11-code-architecture.md](11-code-architecture.md) — структура кода и env-переменные
- [09-security.md](09-security.md) — почему dev-вход закрыт в проде, модель угроз
