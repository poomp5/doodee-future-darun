ARG BUN_VERSION=1

FROM oven/bun:${BUN_VERSION}-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ pkg-config build-essential ca-certificates curl \
    libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
COPY prisma ./prisma/

RUN --mount=type=cache,target=/root/.bun \
    bun install --frozen-lockfile

FROM deps AS builder

COPY . .

RUN --mount=type=cache,target=/app/.next/cache \
    bun run build

FROM base AS runner

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl passwd libcairo2 libpango-1.0-0 libpangocairo-1.0-0 \
    libjpeg62-turbo libgif7 librsvg2-2 \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 bunjs && \
    useradd --system --uid 1001 --gid bunjs --shell /usr/sbin/nologin nextjs

COPY --from=builder --chown=nextjs:bunjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:bunjs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:bunjs /app/public ./public
COPY --from=builder --chown=nextjs:bunjs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

CMD ["bun", "server.js"]
