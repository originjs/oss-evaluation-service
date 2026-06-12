FROM node:22-bookworm-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && corepack prepare pnpm@9.7.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages

RUN pnpm install --frozen-lockfile --ignore-scripts --filter @orginjs/oss-evaluation-api-server...
RUN pnpm --filter @orginjs/oss-evaluation-util build
RUN pnpm --filter @orginjs/oss-evaluation-api-server build

ENV NODE_ENV=production
ENV PORT=3000

RUN mkdir -p /app/logs /app/upload && chown -R node:node /app

USER node

EXPOSE 3000

WORKDIR /app/packages/api-server

CMD ["node", "dist/app.js"]
