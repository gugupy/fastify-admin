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

---

## Install

```bash
npm install fastify-admin
```

**Peer dependencies** — install these if you don't have them already:

```bash
npm install fastify fastify-plugin @fastify/cookie @fastify/jwt @fastify/static @mikro-orm/core
```

---

## Quick Start

### 1. Define a resource for your entity

```ts
import { AdminResource } from 'fastify-admin'
import { Product } from './entities/product.entity.js'

export class ProductResource extends AdminResource {
  entity = Product
  label = 'Products'

  listColumns() { return ['id', 'name', 'price'] }
  showFields()  { return ['id', 'name', 'price', 'createdAt'] }
  editFields()  { return ['name', 'price'] }
  addFields()   { return ['name', 'price'] }
}
```

### 2. Register the plugin

```ts
import Fastify from 'fastify'
import { MikroORM } from '@mikro-orm/postgresql'
import { fastifyAdmin, User, Role, Permission } from 'fastify-admin'
import { ProductResource } from './resources/product.resource.js'

const orm = await MikroORM.init({
  entities: [User, Role, Permission, Product],
  dbName: 'mydb',
  // ... rest of your db config
})

const app = Fastify()

await app.register(fastifyAdmin, {
  orm,
  name: 'My Admin',
  signup: false,
  resources: {
    product: new ProductResource(),
  },
})

await app.listen({ port: 3001 })
// Admin UI → http://localhost:3001/
```

### 3. Create your first admin user

```bash
npx fastify-admin create-admin
```

Open `http://localhost:3001` and log in.

---

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `orm` | `MikroORM` | required | Your MikroORM instance |
| `name` | `string` | `'FastifyAdmin'` | Admin panel title |
| `signup` | `boolean` | `true` | Allow public signup |
| `prefix` | `string` | `'/'` | URL prefix for the admin |
| `appBaseUrl` | `string` | `'http://localhost:3001'` | Base URL (used in emails) |

**Environment variables:**

```bash
JWT_SECRET=your-secret-here        # Required in production
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

## Customising a Resource

```ts
class OrderResource extends AdminResource {
  entity = Order
  label = 'Orders'

  // Which columns show in the list view
  listColumns() { return ['id', 'status', 'total', 'createdAt'] }

  // Which fields show on the detail page
  showFields() { return ['id', 'status', 'total', 'customer', 'createdAt'] }

  // Which fields appear in the edit form
  editFields() { return ['status'] }

  // Which fields appear in the create form
  addFields() { return ['status', 'total', 'customer'] }
}
```

---

## Documentation

| Topic | Link |
|-------|------|
| Getting started | [docs/getting-started.md](./docs/getting-started.md) |
| Adding entities | [docs/adding-entities.md](./docs/adding-entities.md) |
| Configuration & env vars | [docs/configuration.md](./docs/configuration.md) |
| Authentication & OAuth | [docs/authentication.md](./docs/authentication.md) |
| Roles & permissions | [docs/rbac.md](./docs/rbac.md) |
| Deployment | [docs/deployment.md](./docs/deployment.md) |

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Issues and PRs are welcome.

---

## License

MIT — [Gughanathan Mani](https://github.com/gugupy)
