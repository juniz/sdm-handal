#!/usr/bin/env bash
set -euo pipefail

echo "==> Pulling latest code from origin/main..."
git pull origin main

echo "==> Building fresh Docker image (reading .env for NEXT_PUBLIC_* vars)..."
docker compose -f docker-compose.aapanel.yml build

echo "==> Recreating sdm-app container..."
docker compose -f docker-compose.aapanel.yml up -d --force-recreate

echo "==> Cleaning up dangling images..."
docker image prune -f

echo "==> Purging Nginx reverse proxy cache (if enabled in aaPanel)..."
if [ -d /www/server/proxy_cache_dir ]; then
	rm -rf /www/server/proxy_cache_dir/* || true
fi
if command -v nginx >/dev/null 2>&1; then
	nginx -s reload || true
fi

echo "==> Done! Current container status:"
docker ps --filter "name=sdm-app"
