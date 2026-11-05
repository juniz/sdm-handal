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

echo "==> Done! Current container status:"
docker ps --filter "name=sdm-app"
