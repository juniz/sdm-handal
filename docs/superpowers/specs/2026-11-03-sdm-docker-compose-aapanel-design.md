# SDM Handal Docker Compose for aaPanel Deployment Design

**Date:** 2026-11-03  
**Target Project:** `sdm` (Next.js 15, React 19)  
**Deployment Target:** aaPanel Docker Manager on VPS / Linux Server  
**Author:** Antigravity / Hardiko  

---

## 1. Context & Motivation

`sdm` is a Next.js 15 fullstack web application serving internal HR and clinical staff at RS Bhayangkara Nganjuk. Currently, production deployments rely on a local PM2 process (`ecosystem.config.js`).

To standardize deployment on aaPanel (which already runs `bios-backend` in Docker on port `3001` via `docker-compose.aapanel.yml`), `sdm` requires containerization with:
- Zero port collisions with existing services (binds to host loopback port `3002` mapped to container internal port `3000`).
- Persistent volume bindings for attendance photos (`public/photos`), uploaded documents (`uploads`, `public/uploads`), and execution logs (`logs`).
- Compatibility with native node modules (`bcrypt`) via Debian Bookworm slim base image.
- `extra_hosts` bridge mapping (`host.docker.internal:host-gateway`) allowing containerized Next.js routes to connect to host-level MySQL (`DB_HOST=host.docker.internal` or host IP) and LAN database instances (`DB_PORT=6671`).

---

## 2. Architecture & Components

```
                aaPanel Nginx Reverse Proxy
            (Domain: https://presensi.itbhayangkara.id)
                            │
               Proxy pass to 127.0.0.1:3002
                            │
                            ▼
      ┌──────────────────────────────────────────────┐
      │  Docker Container: sdm-app                   │
      │  Internal Port: 3000                         │
      │  Base Image: node:22.23.4-bookworm-slim      │
      │  CVE Guard: >= 22.23.4 (CVE-2026-111497)     │
      │  User: node (non-root)                       │
      │  Init: dumb-init                             │
      └───────────┬────────────────────┬─────────────┘
                  │                    │
                  ▼                    ▼
          Host Persistent Data      Host / LAN Services
       - ./uploads                  - MySQL DB (host.docker.internal:6671)
       - ./public/photos            - bios-backend (127.0.0.1:3001)
       - ./logs
```

---

## 3. Specifications of Deliverables

### A. `.dockerignore`
Located at `sdm/.dockerignore`. Ensures clean build context without leaking developer state while retaining `.env` for production client build bundling:
- Ignores: `.git`, `node_modules`, `.next`, `logs`, `.worktrees`, `docs`, `testing`, `scratch`, `*.log`.
- Keeps: `.env*` (when building on server with real credentials).

### B. `Dockerfile`
Located at `sdm/Dockerfile`. Two-stage multi-stage build hardened against the October 21, 2026 Node.js security advisory (`CVE-2026-111497` "Node2Shell" Brotli RCE CVSS 9.2, `CVE-2026-105482` DNS NUL truncation, `CVE-2026-105483`/`CVE-2026-106069` TLS hostname bypass):
1. **Stage 1: `builder` (`node:22.23.4-bookworm-slim`)**
   - Pinned to `22.23.4` (not floating `node:22-bookworm-slim`, preventing stale unpatched local image cache on aaPanel VPS).
   - Sets `ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` so `puppeteer-core` skips unnecessary browser binary downloads.
   - Copies `package*.json` and runs `npm install --legacy-peer-deps`.
   - Copies application source code and configuration, runs `npm run build`, then `npm prune --omit=dev --legacy-peer-deps`.
2. **Stage 2: `runner` (`node:22.23.4-bookworm-slim`)**
   - **Hard Runtime CVE Assertion Guard (blocks build if Node < `22.23.4` / `24.22.1` / `26.12.1`):**
     ```dockerfile
     RUN node -e "const [M,m,p] = process.versions.node.split('.').map(Number); if ((M===22&&(m<23||(m===23&&p<4)))||(M===24&&(m<22||(m===22&&p<1)))||(M===26&&(m<12||(m===12&&p<1)))) process.exit(1);"
     ```
   - Runs `apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends dumb-init ca-certificates && rm -rf /var/lib/apt/lists/*` so Debian OS libraries (`openssl`, `libc6`) are also patched.
   - Sets `NODE_ENV=production`, `PORT=3000`, `HOSTNAME=0.0.0.0`, `TZ=Asia/Jakarta`.
   - Copies pruned `node_modules`, `.next`, `public`, `package.json`, `next.config.js`.
   - Ensures runtime permissions for `node:node` on `/app/uploads`, `/app/public/photos`, `/app/public/uploads`, and `/app/logs`.
   - Runs as non-root `USER node`, exposes port `3000`, `ENTRYPOINT ["dumb-init", "--"]`, `CMD ["npm", "start"]`.

### C. `docker-compose.aapanel.yml`
Located at `sdm/docker-compose.aapanel.yml`. Spec:
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
      # Bind to 127.0.0.1 so only aaPanel Nginx can access publicly
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
      test: ["CMD-SHELL", "node -e 'require(\"http\").get(\"http://127.0.0.1:3000\", (r) => {if (r.statusCode >= 500) process.exit(1);})'"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

networks:
  sdm-network:
    driver: bridge
```

### D. aaPanel Nginx Reverse Proxy Documentation
Guide included in the implementation plan:
- Target proxy: `http://127.0.0.1:3002`
- Enable WebSocket headers (`Upgrade`, `Connection`).
- Client max body size `50m` (for photo upload and batch payroll imports).

---

## 4. Verification & Testing Strategy

1. **Local Build Test:**
   - Execute `docker compose -f docker-compose.aapanel.yml config` to validate YAML schema.
2. **Container Launch Test:**
   - Build image with `--no-cache` check on syntax.
   - Verify healthcheck transition from starting to healthy.
3. **Volume Perms Test:**
   - Verify uploaded files can be created in mounted `./public/photos` without permission errors.
