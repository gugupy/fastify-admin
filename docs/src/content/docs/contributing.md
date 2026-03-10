---
title: Contributing
description: How to run the fastify-admin monorepo locally for development and contributions.
---

This guide is for contributors working on the `fastify-admin` source code. If you just want to use the package in your app, see [Getting Started](/getting-started).

---

## Requirements

| Tool | Version |
|------|---------|
| Node.js | 20 or newer |
| pnpm | 10 or newer |
| Docker | any recent |

---

## Setup

```bash
git clone https://github.com/your-org/fastify-admin
cd fastify-admin
pnpm install
```

Start the database:

```bash
docker compose up postgres -d
```

Start both the API and frontend in parallel:

```bash
pnpm dev
```

- API server → `http://localhost:3001`
- Web app → `http://localhost:5173`

---

## Create a Dev Admin User

```bash
pnpm create-admin
```

---

## Key Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start API + frontend in parallel |
| `pnpm dev:api` | Start API only |
| `pnpm dev:web` | Start frontend only |
| `pnpm test` | Run all tests |
| `pnpm test:watch` | Re-run tests on file changes |
| `pnpm bundle` | Build web + copy to `ui/` + build package |
| `pnpm release` | Bundle then publish to npm |
| `pnpm migration:create` | Create a new MikroORM migration |
| `pnpm migration:up` | Run pending migrations |

---

## Monorepo Structure

```
web/              ← React frontend (Vite + TanStack Router)
fastify-admin/    ← The npm package + dev server
types/            ← Shared HTTP contract types (@fastify-admin/types)
docs/             ← This documentation site (Astro Starlight)
test-app/         ← Minimal app for manual integration testing
```

See [Project Structure](/project-structure) for a deeper breakdown.

---

## Running Tests

Tests use a real PostgreSQL database. Set these in `fastify-admin/.env`:

```env
TEST_DB_NAME=fastifyadmin_test
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
```

Then run:

```bash
pnpm test
```

Each suite spins up a full Fastify app, runs tests, then tears down. See [Testing](/testing) for details on writing tests.
