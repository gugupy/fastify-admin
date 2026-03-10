---
title: CLI Commands
description: The fastify-admin CLI for scaffolding, user management, migrations, and more.
---

`fastify-admin` ships with a CLI available as `npx fastify-admin <command>` once the package is installed.

The CLI automatically loads `.env` from your current working directory, so no extra setup is needed.

---

## Project Setup

### `init`

```bash
npx fastify-admin init
```

Prompts for a project name, creates a new directory, and scaffolds a complete starter project inside it:

```
my-app/
├── .env                         # Database and auth config
├── .gitignore
├── package.json
├── tsconfig.json
├── mikro-orm.config.ts          # ORM config with built-in entities
└── src/
    ├── index.ts                 # Fastify server entry point
    ├── entities/
    │   └── post.entity.ts       # Example entity
    └── views/
        └── post.view.ts         # Example EntityView
```

After running:

```bash
cd my-app
npm install
# Edit .env with your database credentials
npx fastify-admin migrate:up
npx fastify-admin create-admin
npm run dev
```

### `generate:resource`

```bash
npx fastify-admin generate:resource Product
```
Scaffolds a new entity + EntityView pair:
- `src/entities/product.entity.ts` — MikroORM entity with `id`, `name`, `createdAt`
- `src/views/product.view.ts` — `ProductView` extending `EntityView` with sensible defaults

After generating, register the view in your server:

```ts
import { ProductView } from './views/product.view.js'

await app.register(fastifyAdmin, {
  orm,
  views: {
    product: new ProductView(),
  },
})
```

---

## User Management

### `create-admin`

```bash
npx fastify-admin create-admin
```
Creates a new user and assigns them the Admin role. Prompts interactively for email, username, full name, and password.

### `reset-password`

```bash
npx fastify-admin reset-password
```
Resets the password for an existing user. Prompts for the user's email and new password (with confirmation).

---

## Migrations

### `migrate:up`

```bash
npx fastify-admin migrate:up
```
Applies all pending migrations. Run this after installing the package to set up the admin tables.

### `migrate:down`

```bash
npx fastify-admin migrate:down
```
Rolls back the last applied migration.

### `migrate:create`

```bash
npx fastify-admin migrate:create [name]
```
Creates a new migration file based on current entity changes.

### `schema:update`

```bash
npx fastify-admin schema:update
```
Syncs the database schema directly without creating a migration. **Development only** — use `migrate:up` in production.

---

## Environment Variables

The CLI reads database config from env vars (or `.env` in your project root):

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | Full connection URL (overrides all below) |
| `DB_NAME` | `fastifyadmin` | Database name |
| `DB_HOST` | `localhost` | Database host |
| `DB_PORT` | `5432` | Database port |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `password` | Database password |

---

## Monorepo / Contributing

If you're working in the fastify-admin monorepo itself, use the `pnpm` scripts instead:

```bash
pnpm create-admin
pnpm reset-password
pnpm migration:create
pnpm migration:up
pnpm migration:down
```

See [Contributing](/contributing) for full monorepo setup.
