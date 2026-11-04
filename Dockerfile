# Stage 1: Builder
FROM node:22.23.4-bookworm-slim AS builder

WORKDIR /app

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAABnQ7KZ335kF5jw7
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY

COPY package*.json ./

RUN npm install --include=dev --legacy-peer-deps

COPY . .

RUN NODE_ENV=production npm run build
RUN npm prune --omit=dev --legacy-peer-deps

# Stage 2: Runner
FROM node:22.23.4-bookworm-slim AS runner

WORKDIR /app

# CVE-2026-111497 (Node2Shell Brotli RCE) version assertion guard
RUN node -e "const [M,m,p] = process.versions.node.split('.').map(Number); if ((M===22&&(m<23||(m===23&&p<4)))||(M===24&&(m<22||(m===22&&p<1)))||(M===26&&(m<12||(m===12&&p<1)))) process.exit(1);"

# Install OS updates & dumb-init
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
    dumb-init \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

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
RUN mkdir -p /app/uploads /app/public/photos /app/public/uploads /app/logs \
    && chown -R node:node /app/uploads /app/public/photos /app/public/uploads /app/logs

USER node

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
