FROM node:22-bookworm-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && corepack prepare pnpm@9.7.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN pnpm install --frozen-lockfile --ignore-scripts --filter @orginjs/oss-evaluation-integration...
RUN pnpm --filter @orginjs/oss-evaluation-util build
RUN chmod 755 packages/integration/bin/scorecard-linux-arm64 \
  packages/integration/bin/scorecard-linux-amd64

ENV NODE_ENV=production
ENV PORT=3001

RUN mkdir -p /app/logs && chown -R node:node /app

USER node

EXPOSE 3001

CMD ["node", "packages/integration/bin/www.js"]
