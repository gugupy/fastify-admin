---
title: API Reference
description: Complete reference for all fastify-admin public exports.
---

All exports are available from the `fastify-admin` package.

```ts
import { fastifyAdmin, EntityView, ViewRegistry } from 'fastify-admin'
import type { FastifyAdminOptions, EntityConfig } from 'fastify-admin'
```

---

## Plugin

### `fastifyAdmin`

The Fastify plugin. Register it with your Fastify instance.

```ts
await app.register(fastifyAdmin, options)
```

See [`FastifyAdminOptions`](#fastifyadminoptions) for all available options.

---

## Classes

### `EntityView`

Base class for entity admin configuration. Extend it to customise how an entity appears in the admin UI.

```ts
import { EntityView } from 'fastify-admin'

class ProductView extends EntityView {
  label = 'Products'
  icon = 'shopping-bag-01'

  listColumns() { return ['id', 'name', 'price', 'stock'] }
  showFields()  { return ['id', 'name', 'description', 'price', 'stock'] }
  editFields()  { return ['name', 'description', 'price', 'stock'] }

  // Disable delete for all users
  permissions() { return { delete: false as const } }
}
```

#### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string \| undefined` | Entity name (capitalised) | Sidebar display name |
| `icon` | `string \| undefined` | — | Lucide icon name (e.g. `'User'`, `'ShoppingCart'`) |
| `sidebar` | `boolean` | `true` | Whether to show the entity in the sidebar |

#### Methods

Override any of these to customise the view. Return an empty array to show all fields/columns.

| Method | Return type | Description |
|--------|-------------|-------------|
| `listColumns()` | `string[]` | Columns shown in the list table |
| `showFields()` | `string[]` | Fields shown on the detail page |
| `editFields()` | `string[]` | Fields in the edit form |
| `addFields()` | `string[]` | Fields in the create form |
| `rowActions()` | `RowAction[]` | Extra row-level action buttons |
| `permissions()` | `EntityPermissions` | Permission string overrides |

---

### `ViewRegistry`

User-facing registry for collecting entity views across multiple files. Supports fluent chaining.

```ts
import { ViewRegistry } from 'fastify-admin'
import { UserView } from './user.view.js'
import { ProductView } from './product.view.js'

export const views = new ViewRegistry()
  .register('user', new UserView())
  .register('product', new ProductView())
```

#### Methods

| Method | Return type | Description |
|--------|-------------|-------------|
| `register(entityName, view)` | `this` | Register a view for the given entity name. Returns `this` for chaining. |

---

## Entities

These MikroORM entities must be included in your `entities` array in `mikro-orm.config.ts`.

### `User`

The admin user entity. Handles authentication, roles, and MFA.

### `Role`

A named role that can be assigned to users.

### `Permission`

A granular permission string (e.g. `product.create`) that can be assigned to roles.

---

## Types

### `FastifyAdminOptions`

Options passed to `app.register(fastifyAdmin, options)`.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `orm` | `MikroORM` | — | **Required.** Your initialised MikroORM instance |
| `name` | `string` | `'Fastify Admin'` | Display name shown in the admin panel. Env: `ADMIN_NAME` |
| `signup` | `boolean` | `false` | Allow self-registration. Env: `ADMIN_SIGNUP_ENABLED=true` |
| `requireEmailVerification` | `boolean` | `false` | Require email OTP on signup. Env: `ADMIN_EMAIL_VERIFICATION=true` |
| `mfaEnabled` | `boolean` | `false` | Enable email sending (required for MFA/verification). Env: `ADMIN_MFA_ENABLED=true` |
| `views` | `Record<string, ViewConfig> \| ViewRegistry` | `{}` | Entity view configurations |
| `securityEntities` | `string[]` | `['user', 'role', 'permission']` | Entity names hidden from sidebar and model routes |
| `appBaseUrl` | `string` | `'http://localhost:3001'` | Base URL for OAuth redirects. Env: `ADMIN_BASE_URL` |

---

### `EntityConfig`

Plain (JSON-serialisable) entity configuration sent to the frontend via `/api/admin-config`.

| Field | Type | Description |
|-------|------|-------------|
| `label` | `string?` | Sidebar display name |
| `icon` | `string?` | Icon name string |
| `sidebar` | `boolean?` | Show in sidebar |
| `permissions` | `EntityPermissions?` | Per-operation permission overrides |
| `list` | `ListConfig?` | List view config |
| `show` | `ShowConfig?` | Detail view config |
| `edit` | `EditConfig?` | Edit form config |
| `add` | `AddConfig?` | Create form config |
| `actions` | `RowAction[]?` | Extra row actions |

---

### `EntityPermissions`

Controls access to each operation. A permission string gates access via RBAC; `false` disables the operation entirely for all users.

```ts
interface EntityPermissions {
  list?:   string | false  // default: '{model}.list'
  show?:   string | false  // default: '{model}.show'
  create?: string | false  // default: '{model}.create'
  edit?:   string | false  // default: '{model}.edit'
  delete?: string | false  // default: '{model}.delete'
}
```

**Examples:**

```ts
// Disable delete entirely
permissions() { return { delete: false as const } }

// Custom permission strings
permissions() { return { list: 'admin.products', create: 'admin.products' } }

// Read-only (disable all mutations)
permissions() {
  return { create: false as const, edit: false as const, delete: false as const }
}
```

---

### `RowAction`

An extra action button rendered in each row of the list table.

```ts
interface RowAction {
  label: string  // Button text
  href:  string  // URL (can include {id} placeholder)
}
```

---

### `ListConfig`

```ts
interface ListConfig {
  columns?: string[]  // Column field names to display
}
```

### `ShowConfig`

```ts
interface ShowConfig {
  fields?: string[]  // Field names to display on the detail page
}
```

### `EditConfig`

```ts
interface EditConfig {
  fields?: string[]  // Field names to show in the edit form
}
```

### `AddConfig`

```ts
interface AddConfig {
  fields?: string[]  // Field names to show in the create form
}
```

---

### `ViewConfig`

A view entry: either a plain `EntityConfig` object or an `EntityView` instance.

```ts
type ViewConfig = EntityConfig | EntityView
```

---

### `AdminConfig`

Shape of the `/api/admin-config` response. Useful for building custom frontends.

```ts
interface AdminConfig {
  name:                     string
  signup:                   boolean
  requireEmailVerification: boolean
  mfaEnabled:             boolean
  securityEntities:         string[]
  oauth: {
    google:    boolean
    github:    boolean
    microsoft: boolean
  }
  entities: Record<string, EntityConfig>
}
```
