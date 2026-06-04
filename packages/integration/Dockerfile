FROM node:22-bookworm-slim AS build

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && corepack prepare pnpm@9.7.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
RUN pnpm install --frozen-lockfile --ignore-scripts --filter @orginjs/oss-evaluation-integration...
RUN pnpm --filter @orginjs/oss-evaluation-util build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=build --chown=node:node /app /app

RUN mkdir -p /app/logs && chown -R node:node /app

USER node

EXPOSE 3001

CMD ["node", "packages/integration/bin/www.js"]