#!/usr/bin/env bash
#
# Деплой TravelMate в прод (trip-radar.ru).
# Деплой ручным копированием: собирает фронт, rsync'ит web/ + server/,
# пересобирает API-образ. Переменные можно переопределить через окружение.
#
#   ./deploy.sh                 # деплой на дефолтный сервер
#   DEPLOY_HOST=root@1.2.3.4 ./deploy.sh
#
set -euo pipefail

cd "$(dirname "$0")"

# Адрес сервера держим вне git: deploy.env (gitignored, см. deploy.env.example).
# shellcheck disable=SC1091
[ -f deploy.env ] && { set -a; . ./deploy.env; set +a; }

HOST="${DEPLOY_HOST:?не задан DEPLOY_HOST — скопируй deploy.env.example в deploy.env и заполни}"
PORT="${DEPLOY_PORT:-22}"
REMOTE="${DEPLOY_DIR:-/opt/travelmate}"
API_URL="${VITE_API_URL:-https://trip-radar.ru}"
SSH="ssh -p $PORT"
COMPOSE="docker compose -f docker-compose.prod.yml"

echo "==> 1/6 Сборка фронта (VITE_API_URL=$API_URL)"
( cd app && VITE_API_URL="$API_URL" npm run build )

echo "==> 2/6 Бэкап web/ + api-образа (для отката)"
$SSH "$HOST" "cd $REMOTE && docker tag travelmate-api:latest travelmate-api:rollback && rm -rf web.bak && cp -r web web.bak"

echo "==> 3/6 Заливка фронта → $REMOTE/web"
rsync -az --delete -e "$SSH" app/dist/ "$HOST:$REMOTE/web/"

echo "==> 4/6 Заливка бэка → $REMOTE/server"
rsync -az --delete \
  --exclude node_modules --exclude dist --exclude .env \
  --exclude '*.tsbuildinfo' --exclude coverage \
  -e "$SSH" server/ "$HOST:$REMOTE/server/"

echo "==> 5/6 Пересборка + рестарт API"
$SSH "$HOST" "cd $REMOTE && $COMPOSE build api && $COMPOSE up -d api && docker image prune -f"

echo "==> 6/6 Смоук-тест"
for path in "" "/api/v1/trips"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://trip-radar.ru$path")
  echo "    https://trip-radar.ru$path → $code"
done

echo
echo "Готово. Откат при поломке:"
echo "  $SSH $HOST 'cd $REMOTE && rm -rf web && mv web.bak web && \\"
echo "    docker tag travelmate-api:rollback travelmate-api:latest && $COMPOSE up -d api'"
