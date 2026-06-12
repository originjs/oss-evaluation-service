# ---------- build stage ----------
FROM node:22-bookworm-slim AS build

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && corepack prepare pnpm@9.7.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages

# website 的 vite alias 直接引用 shared-components 源码,
# 因此 shared-components 及其依赖也必须安装(注意它的 scope 是 @originjs 不是 @orginjs)。
RUN pnpm install --frozen-lockfile --ignore-scripts \
    --filter @orginjs/oss-evaluation-website... \
    --filter @originjs/oss-evaluation-components...

# 前端 API 基础路径在构建期固化进产物。
# /oss-evaluation-api 由 nginx 反向代理到 api-server(见 nginx.conf)。
ARG VITE_BACKEND_SERVICE_URL=/oss-evaluation-api
ENV VITE_BACKEND_SERVICE_URL=$VITE_BACKEND_SERVICE_URL

# 只执行 vite build(镜像构建内跳过 vue-tsc 类型检查)
RUN cd packages/website && pnpm exec vite build

# ---------- runtime stage ----------
FROM nginx:1.27-alpine

COPY packages/website/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/website/dist /usr/share/nginx/html

EXPOSE 80
