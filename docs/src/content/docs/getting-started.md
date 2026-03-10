---
title: Getting Started
description: Add a full admin panel to your Fastify + MikroORM app in minutes.
---

`fastify-admin` is an npm package that plugs into any existing Fastify + MikroORM app. It auto-discovers your entities and generates a full CRUD admin UI with authentication, RBAC, and dark mode — no frontend code required.

---

## Install

```bash
npm install fastify-admin
```

---

## Zero Config

Pass your MikroORM instance to the plugin. That's it.

```ts
import Fastify from 'fastify'
import { MikroORM } from '@mikro-orm/postgresql'
import { fastifyAdmin } from 'fastify-admin'
import config from './mikro-orm.config.js'

const orm = await MikroORM.init(config)
const app = Fastify()

await app.register(fastifyAdmin, { orm })

await app.listen({ port: 3001 })
// Admin UI → http://localhost:3001
```

All your MikroORM entities are auto-discovered. The plugin generates a full list/view/create/edit/delete UI for each one, serves the bundled frontend at `/`, and registers all API routes under `/api/`.

---

## Create Your First Admin User

```bash
npx fastify-admin create-admin
```

Follow the prompts. The user is automatically given the Admin role.

---

## What You Get for Free

| Feature | Details |
|---------|---------|
| **Auto CRUD** | List, view, create, edit, delete for every entity |
| **Authentication** | Email/password login, sessions, JWT |
| **RBAC** | Admin and Viewer roles out of the box, fully manageable |
| **Dark mode** | Light / dark / system toggle built in |
| **Relations** | ManyToOne, ManyToMany rendered as dropdowns automatically |
| **Security section** | User, Role, Permission management hidden from main nav |

On first start the plugin automatically runs migrations and seeds the Admin/Viewer roles.

---

## Full Developer Control

Everything is opt-in — start zero-config and add customisation only where you need it.

### Customise an entity

```ts
await app.register(fastifyAdmin, {
  orm,
  views: {
    post: {
      label: 'Blog Posts',
      icon: 'BookOpen01',
      list: { columns: ['id', 'title', 'published'] },
      edit: { fields: ['title', 'content', 'published'] },
    },
  },
})
```

### Use EntityView classes (recommended for larger projects)

```ts
import { EntityView, ViewRegistry } from 'fastify-admin'

class PostView extends EntityView {
  label = 'Blog Posts'
  icon = 'BookOpen01'

  listColumns() { return ['id', 'title', 'published'] }
  editFields()  { return ['title', 'content', 'published'] }

  permissions() {
    return { delete: false }  // disable delete for all users
  }
}

const views = new ViewRegistry()
  .register('post', new PostView())

await app.register(fastifyAdmin, { orm, views })
```

### Plugin options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `orm` | `MikroORM` | **required** | Your initialised MikroORM instance |
| `name` | `string` | `'Fastify Admin'` | Panel name shown in the sidebar |
| `views` | `Record<string, EntityView \| EntityConfig> \| ViewRegistry` | `{}` | Per-entity customisation |
| `signup` | `boolean` | `false` | Allow self-registration |
| `requireEmailVerification` | `boolean` | `false` | Require email OTP on signup |
| `mfaEnabled` | `boolean` | `false` | Enable MFA (requires SMTP) |
| `securityEntities` | `string[]` | `['user','role','permission']` | Entities hidden from main nav |
| `appBaseUrl` | `string` | `'http://localhost:3001'` | Base URL for OAuth callbacks |

All options can also be set via environment variables — see [Configuration](/configuration).

---

## Next Steps

- [Adding Entities](/adding-entities) — customise columns, fields, permissions, row actions, and custom renderers
- [Roles & Permissions](/rbac) — manage who can do what
- [Icons](/icons) — swap any icon with any React icon library
- [Authentication](/authentication) — OAuth, MFA, email verification
- [Configuration](/configuration) — full environment variable reference
