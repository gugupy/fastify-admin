FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

WORKDIR /app

# copy workspace manifests first for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY fastify-admin/package.json ./fastify-admin/package.json
COPY types/package.json ./types/package.json
COPY web/package.json ./web/package.json

RUN pnpm install --frozen-lockfile

EXPOSE 5173

CMD ["pnpm", "--filter", "web", "dev"]
