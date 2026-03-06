FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

WORKDIR /app

# copy workspace manifests first for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY fastify-admin/package.json ./fastify-admin/package.json
COPY types/package.json ./types/package.json

RUN pnpm install --frozen-lockfile

EXPOSE 3001

CMD ["pnpm", "--filter", "fastify-admin", "dev"]
