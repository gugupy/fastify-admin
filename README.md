# fastify-admin

A self-hosted admin panel for **Fastify + MikroORM**. One plugin, zero frontend work — get authentication, RBAC, and full CRUD for every entity in minutes.

[![npm version](https://img.shields.io/npm/v/fastify-admin)](https://www.npmjs.com/package/fastify-admin)
[![license](https://img.shields.io/npm/l/fastify-admin)](./LICENSE)

---

## Features

- **Auto CRUD** — list, create, edit, delete for every MikroORM entity
- **Authentication** — email/password, email verification, MFA
- **OAuth** — Google, GitHub, Microsoft sign-in
- **RBAC** — roles and permissions, auto-seeded and UI-manageable
- **Dark mode** — light / dark / system theme
- **Zero frontend** — UI is bundled, nothing to build
- **CLI** — scaffold, migrate, and manage users via `npx fastify-admin`

---

## Install

```bash
npm install fastify-admin
```

**Peer dependencies** — install these if you don't have them already:

```bash
npm install fastify fastify-plugin @fastify/cookie @fastify/jwt @fastify/static @mikro-orm/core @mikro-orm/migrations
```

---

## Quick Start

### 1. Scaffold your project

```bash
npx fastify-admin init
```

Prompts for a project name and creates a new directory with `.env`, `package.json`, `tsconfig.json`, `mikro-orm.config.ts`, an example entity, view, and server entry.

### 2. Run migrations

```bash
npx fastify-admin migrate:up
```

### 3. Create your first admin user

```bash
npx fastify-admin create-admin
```

### 4. Register the plugin

```ts
import Fastify from 'fastify'
import { MikroORM } from '@mikro-orm/postgresql'
import { fastifyAdmin, EntityView } from 'fastify-admin'
import config from './mikro-orm.config.js'

class ProductView extends EntityView {
  label = 'Products'
  listColumns() { return ['id', 'name', 'price'] }
  showFields()  { return ['id', 'name', 'price', 'createdAt'] }
  editFields()  { return ['name', 'price'] }
  addFields()   { return ['name', 'price'] }
}

const orm = await MikroORM.init(config)
const app = Fastify()

await app.register(fastifyAdmin, {
  orm,
  name: 'My Admin',
  views: {
    product: new ProductView(),
  },
})

await app.listen({ port: 3001 })
// Admin UI → http://localhost:3001/
```

---

## CLI

```bash
npx fastify-admin init                       # Scaffold starter files
npx fastify-admin generate:resource Product  # Scaffold entity + view
npx fastify-admin migrate:up                 # Apply migrations
npx fastify-admin migrate:down               # Roll back last migration
npx fastify-admin migrate:create [name]      # Create a migration
npx fastify-admin schema:update              # Sync schema (dev only)
npx fastify-admin create-admin               # Create an admin user
npx fastify-admin reset-password             # Reset a user's password
```

---

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `orm` | `MikroORM` | required | Your MikroORM instance |
| `name` | `string` | `'FastifyAdmin'` | Admin panel title |
| `signup` | `boolean` | `true` | Allow public signup |
| `views` | `Record<string, EntityView>` | `{}` | Entity views to expose |
| `appBaseUrl` | `string` | `'http://localhost:3001'` | Base URL (used in emails) |

**Environment variables:**

```bash
JWT_SECRET=your-secret-here
APP_BASE_URL=https://admin.example.com

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mydb
DB_USER=postgres
DB_PASSWORD=password

# SMTP (for email verification, password reset)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=yourpassword
SMTP_FROM=noreply@example.com

# OAuth (optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
```

---

## Documentation

Full documentation at **[docs.fastifyadmin.dev](https://docs.fastifyadmin.dev)**

---

## Contributing

See [contributing guide](./docs/src/content/docs/contributing.md). Issues and PRs are welcome.

---

## License

MIT — [Gughanathan Mani](https://github.com/gugupy)
