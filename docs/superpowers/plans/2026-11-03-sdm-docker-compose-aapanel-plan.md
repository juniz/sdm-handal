# SDM Docker Compose for aaPanel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a production-ready, hardened Docker container and aaPanel Docker Compose setup for the Next.js `sdm` application.

**Architecture:** Two-stage Dockerfile (`node:22.23.4-bookworm-slim`) with runtime CVE assertion guard (blocking builds if Node < `22.23.4` / `24.22.1` / `26.12.1` to safeguard against CVE-2026-111497 "Node2Shell" Brotli RCE). Configured with `docker-compose.aapanel.yml` binding container to host loopback port `127.0.0.1:3002:3000` (for aaPanel Nginx reverse proxy), mounting persistent storage for attendance photos and document uploads, and bridging to host services via `extra_hosts`.

**Tech Stack:** Docker, Docker Compose v2/v3, Node.js 22.23.4 (LTS), Next.js 15, Debian Bookworm Slim, `dumb-init`.

## Global Constraints

- **Base Image:** `node:22.23.4-bookworm-slim` strictly pinned (no unpinned `node:22`).
- **CVE Runtime Assertion:** Hard failure script during container build checking Node patch version for CVE-2026-111497.
- **Port Mapping:** Host loopback `127.0.0.1:${APP_PORT:-3002}:3000` to prevent direct external exposure and avoid port collision with `bios-backend` on `3001`.
- **Security:** Non-root execution (`USER node`), signal forwarding via `dumb-init`.
- **Persistence:** Volume mappings for `./uploads`, `./public/photos`, `./public/uploads`, `./logs`.

---

## File Structure

- **Create:** `src/app/api/health/route.js`
  - Lightweight HTTP health check route returning `{ status: "ok", timestamp: ... }` with HTTP 200 for Docker container health check.
- **Create:** `.dockerignore`
  - Build context ignore list (excludes `.git`, `node_modules`, `.next`, `logs`, but allows `.env*`).
- **Create:** `Dockerfile`
  - Multi-stage build (builder + runner with CVE assertion guard).
- **Create:** `docker-compose.aapanel.yml`
  - aaPanel Docker Manager deployment composition.

---

### Task 1: Create Healthcheck Endpoint & `.dockerignore`

**Files:**
- Create: `src/app/api/health/route.js`
- Create: `.dockerignore`

**Interfaces:**
- Consumes: Next.js App Router route handler.
- Produces: `GET /api/health` returning JSON `{ status: "ok" }`.

- [x] **Step 1: Create health check API route**

Create `src/app/api/health/route.js`:
```javascript
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() },
    { status: 200 }
  );
}
```

- [x] **Step 2: Create `.dockerignore`**

Create `.dockerignore`:
```dockerignore
.git
.gitignore
.next
.vscode
.gemini
.agents
.codex
.impeccable
.superdesign
.superpowers
.worktrees
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*
logs
*.log
testing
scratch
docs
graphify-out
load-testing
*.md
!README.md
```

- [x] **Step 3: Verify syntax of healthcheck endpoint**

Run:
```bash
node --check src/app/api/health/route.js
```
Expected: Exit code 0.

---

### Task 2: Create Hardened `Dockerfile` & `docker-compose.aapanel.yml`

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.aapanel.yml`

**Interfaces:**
- Consumes: Node 22.23.4 runtime, `package.json`, Next.js build artifacts.
- Produces: Docker image `sdm-app:latest` and aaPanel compose service.

- [x] **Step 1: Create `Dockerfile`**

Create `Dockerfile`:
```dockerfile
# Stage 1: Builder
FROM node:22.23.4-bookworm-slim AS builder

WORKDIR /app

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build
RUN npm prune --omit=dev --legacy-peer-deps

# Stage 2: Runner
FROM node:22.23.4-bookworm-slim AS runner

WORKDIR /app

# CVE-2026-111497 (Node2Shell Brotli RCE) version assertion guard
RUN node -e "const [M,m,p] = process.versions.node.split('.').map(Number); if ((M===22&&(m<23||(m===23&&p<4)))||(M===24&&(m<22||(m===22&&p<1)))||(M===26&&(m<12||(m===12&&p<1)))) process.exit(1);"

# Install OS updates & dumb-init
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends     dumb-init     ca-certificates     && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV TZ=Asia/Jakarta
ENV NEXT_TELEMETRY_DISABLED=1
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Copy dependencies and build output
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js

# Create persistent storage directories with node ownership
RUN mkdir -p /app/uploads /app/public/photos /app/public/uploads /app/logs     && chown -R node:node /app/uploads /app/public/photos /app/public/uploads /app/logs

USER node

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
```

- [x] **Step 2: Create `docker-compose.aapanel.yml`**

Create `docker-compose.aapanel.yml`:
```yaml
version: '3.8'

services:
  sdm-app:
    container_name: sdm-app
    build:
      context: .
      dockerfile: Dockerfile
    image: sdm-app:latest
    restart: unless-stopped
    ports:
      # Bind loopback: reverse-proxied by aaPanel Nginx
      - "127.0.0.1:${APP_PORT:-3002}:3000"
    env_file:
      - ./.env
    environment:
      - NODE_ENV=production
      - PORT=3000
      - HOSTNAME=0.0.0.0
      - TZ=Asia/Jakarta
    volumes:
      - ./uploads:/app/uploads
      - ./public/photos:/app/public/photos
      - ./public/uploads:/app/public/uploads
      - ./logs:/app/logs
    extra_hosts:
      - "host.docker.internal:host-gateway"
    networks:
      - sdm-network
    healthcheck:
      test: ["CMD-SHELL", "node -e 'require("http").get("http://127.0.0.1:3000/api/health", (r) => {if (r.statusCode !== 200) process.exit(1);})'"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  sdm-network:
    driver: bridge
```

- [x] **Step 3: Validate Docker Compose configuration syntax**

Run:
```bash
docker compose -f docker-compose.aapanel.yml config > /dev/null || docker-compose -f docker-compose.aapanel.yml config > /dev/null
```
Expected: Exit code 0 without schema or YAML parse errors.

- [x] **Step 4: Update knowledge graph**

Run:
```bash
graphify update .
```
Expected: Exit code 0.
