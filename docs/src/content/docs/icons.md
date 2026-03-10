---
title: Icons
description: How to customise and replace icons using any icon library.
---

fastify-admin ships with [HugeIcons](https://hugeicons.com) as its default icon set. Every icon in the UI is registered in a central **icon registry**, so you can swap any of them for icons from Lucide React, Heroicons, Phosphor, Radix Icons, or any other React icon library — without touching the core package.

---

## How It Works

There are two kinds of icons in the admin UI:

| Kind | What it is | How to override |
|------|-----------|-----------------|
| **Named UI icons** | Fixed slots — sidebar defaults, theme toggle, action buttons | `iconRegistry.override()` |
| **Entity icons** | Per-entity icons shown in the sidebar | `iconRegistry.registerEntityIcons()` |

Both are configured in your `main.tsx` **before** calling `FastifyAdmin.initFromApi()`.

---

## Named UI Icons

These are the built-in icon slots used throughout the admin panel:

| Key | Default | Where it appears |
|-----|---------|-----------------|
| `entity` | DatabaseLightning | Default entity icon in the sidebar |
| `security` | Shield | Security section in the sidebar |
| `sun` | Sun | Theme toggle — light mode |
| `moon` | Moon | Theme toggle — dark mode |
| `system` | Monitor | Theme toggle — system mode |
| `view` | Eye | View button in list table |
| `edit` | Pencil | Edit button in list table |
| `delete` | Trash | Delete button in list table |
| `arrowLeft` | Arrow left | Back button on show/edit pages |

Override any of them by calling `iconRegistry.override()`:

```ts
// main.tsx
import { iconRegistry } from './lib/iconRegistry'
import { Trash2, Pencil, Eye } from 'lucide-react'

iconRegistry.override({
  delete: Trash2,
  edit: Pencil,
  view: Eye,
})
```

You only need to provide the keys you want to change — the rest keep their defaults.

---

## Entity Icons

Entity icons are set via `EntityView.icon` on the server as a string key. The bundled frontend pre-registers the following HugeIcons keys — just use one of these strings and it will resolve automatically:

| Category | Available keys |
|----------|---------------|
| People | `User03`, `UserGroup`, `UserMultiple`, `UserAccount`, `UserCheck01`, `UserStar01` |
| Security | `ShieldUser`, `LockKey`, `Security`, `Lock`, `Key01` |
| Products | `Package01`, `Package02`, `ShoppingBag01`, `ShoppingCart01`, `Store01`, `Tag01` |
| Finance | `Wallet01`, `Money01`, `CreditCard`, `Invoice01` |
| Communication | `Mail01`, `Message01`, `Notification01` |
| Analytics | `Analytics01`, `BarChart`, `PieChart01`, `Chart01`, `Database01`, `Table01` |
| Content | `File01`, `Folder01`, `Image01`, `Note01`, `News01`, `BookOpen01` |
| Navigation | `Home01`, `Search01`, `Settings01`, `Bookmark01`, `Star` |
| Tech | `Code`, `CloudServer`, `ServerStack01`, `Globe02`, `Link01`, `Layers01` |
| Time | `Calendar01`, `Ticket01` |

```ts
// packages/fastify-admin/src/views/product.view.ts
class ProductView extends EntityView {
  icon = 'Package01'  // resolved automatically in the bundled UI
}
```

Any unregistered key falls back to the default entity icon silently.

---

## Using Any Icon Library

The `AdminIconComponent` type is library-agnostic. Any React component that accepts optional `size` and `className` props works:

```ts
type AdminIconComponent = React.ComponentType<{
  size?: number
  className?: string
}>
```

### Lucide React

Lucide icons already match this signature — use them directly:

```ts
import { Trash2, Pencil } from 'lucide-react'

iconRegistry.override({ delete: Trash2, edit: Pencil })
```

### Heroicons

Heroicons v2 accept `className` but not `size`. Wrap them with a thin adapter:

```ts
import { TrashIcon } from '@heroicons/react/24/outline'

const HeroTrash: AdminIconComponent = ({ size = 16, className }) => (
  <TrashIcon style={{ width: size, height: size }} className={className} />
)

iconRegistry.override({ delete: HeroTrash })
```

### Phosphor Icons

```ts
import { Trash } from '@phosphor-icons/react'

iconRegistry.override({ delete: Trash })
```

### HugeIcons (default)

HugeIcons exports SVG data objects, not React components. Use the `asIcon()` helper to wrap them:

```ts
import { asIcon } from './lib/iconRegistry'
import { Delete02Icon } from '@hugeicons/core-free-icons'

iconRegistry.override({ delete: asIcon(Delete02Icon) })
```

---

## Entity Icon in `EntityView`

When writing server-side entity config, the `icon` property is a string key matched against the registry:

```ts
// fastify-admin/src/views/product.view.ts (server)
class ProductView extends EntityView {
  icon = 'Package01'  // must match a key in registerEntityIcons()
}
```

If you need a custom icon not in the pre-registered set, add it to `registerEntityIcons()` in your `main.tsx`:

```ts
// apps/web/src/main.tsx (client)
iconRegistry.registerEntityIcons({
  MyCustomIcon: asIcon(SomeHugeIcon),  // or any AdminIconComponent
})
```

---

## Full Example — `main.tsx`

```ts
import { iconRegistry, asIcon } from './lib/iconRegistry'
import { FastifyAdmin } from './lib/FastifyAdmin'

// 1. Override named UI icons (optional)
import { Trash2, Pencil, Eye } from 'lucide-react'
iconRegistry.override({ delete: Trash2, edit: Pencil, view: Eye })

// 2. Register entity icons by server-side name
import { User03Icon, ShieldUserIcon } from '@hugeicons/core-free-icons'
iconRegistry.registerEntityIcons({
  User03: asIcon(User03Icon),
  ShieldUser: asIcon(ShieldUserIcon),
})

// 3. Init — icons are resolved automatically
await FastifyAdmin.initFromApi()
```
