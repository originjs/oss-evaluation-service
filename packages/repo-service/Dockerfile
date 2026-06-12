FROM node:22-bookworm-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

# git 和 cloc 是运行时依赖:服务需要克隆仓库并对其执行 cloc 统计。
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends git cloc ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9.7.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages

RUN pnpm install --frozen-lockfile --ignore-scripts --filter @orginjs/repo-service...
RUN pnpm --filter @orginjs/oss-evaluation-util build
RUN pnpm --filter @orginjs/repo-service build

ENV NODE_ENV=production
ENV PORT=3002
ENV REPO_DIR=/tmp/oss-evaluation-repos

RUN mkdir -p /app/logs /tmp/oss-evaluation-repos && chown -R node:node /app /tmp/oss-evaluation-repos

USER node

EXPOSE 3002

WORKDIR /app/packages/repo-service

CMD ["node", "dist/app.js"]
