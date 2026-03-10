---
title: Testing
description: How to run and write tests for fastify-admin.
---

Tests are written with **Vitest** and run against a real PostgreSQL database. Each test suite spins up a full Fastify app with the plugin registered, runs tests, then tears it down.

---

## Requirements

- PostgreSQL running locally (or via Docker)
- A dedicated test database (separate from your dev database)

```bash
docker compose up postgres -d
```

---

## Running Tests

From the project root:

```bash
pnpm test              # run all tests once
pnpm test:watch        # re-run on file changes
pnpm test:coverage     # run with coverage report
pnpm test:ui           # open Vitest UI in the browser
```

Or from the `fastify-admin/` directory directly:

```bash
cd fastify-admin
pnpm test
```

---

## Test Database

Tests use a separate database to avoid corrupting dev data. Set these environment variables (or add them to `fastify-admin/.env`):

```env
TEST_DB_NAME=fastifyadmin_test
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
```

Each test suite calls `orm.schema.refreshDatabase()` in `beforeAll` — this drops and recreates all tables so every suite starts clean.

---

## Test Structure

Tests live in `fastify-admin/src/tests/`:

```
tests/
  setup.ts                  ← shared buildApp() / teardown() helpers
  auth.test.ts              ← login, signup, logout, sessions
  email-verification.test.ts ← email verification flow
  oauth.test.ts             ← Google / GitHub / Microsoft OAuth
  entities.test.ts          ← CRUD endpoints for entities
  permissions.test.ts       ← RBAC permission checks
  plugin.test.ts            ← plugin options and resource config
  entity-view.test.ts       ← EntityView class behaviour
  cli.test.ts               ← create-admin / reset-password CLI
  mailer.test.ts            ← email sending helpers
  password.test.ts          ← password hashing utilities
  db.test.ts                ← database connection helpers
  generate-username.test.ts ← username generation logic
```

---

## Writing a Test

Use the shared `buildApp()` helper to get a running app instance:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp, teardown } from './setup.js'

let ctx: Awaited<ReturnType<typeof buildApp>>

beforeAll(async () => {
  ctx = await buildApp()
})

afterAll(async () => {
  await teardown(ctx)
})

describe('my feature', () => {
  it('returns 200', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/admin-config',
    })
    expect(res.statusCode).toBe(200)
  })
})
```

### `buildApp()` options

```ts
buildApp({
  requireEmailVerification: false,  // enable email verification flow
  mfaEnabled: false,              // enable SMTP email sending
  views: {                          // custom entity view config
    role: { label: 'Team Roles', sidebar: false },
  },
})
```

### Making authenticated requests

Most endpoints require a logged-in session. Log in first and pass the cookie:

```ts
const login = await ctx.app.inject({
  method: 'POST',
  url: '/api/auth/login',
  payload: { email: 'admin@example.com', password: 'password123' },
})

const cookie = login.headers['set-cookie'] as string

const res = await ctx.app.inject({
  method: 'GET',
  url: '/api/entities/post',
  headers: { cookie },
})
```
