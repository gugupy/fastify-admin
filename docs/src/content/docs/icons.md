---
title: Icons
description: How to customise and replace icons using any icon library.
---

fastify-admin uses [Lucide React](https://lucide.dev) as its default icon set. Every icon in the UI is registered in a central **icon registry**, so you can swap any of them for icons from Heroicons, Phosphor, Radix Icons, or any other React icon library — without touching the core package.

---

## How It Works

There are two kinds of icons in the admin UI:

| Kind | What it is | How to override |
|------|-----------|-----------------|
| **Named UI icons** | Fixed slots — sidebar defaults, theme toggle, action buttons | `iconRegistry.override()` |
| **Entity icons** | Per-entity icons shown in the sidebar | `EntityView.icon` string |

Both are configured in your `main.tsx` **before** calling `FastifyAdmin.initFromApi()`.

---

## Named UI Icons

These are the built-in icon slots used throughout the admin panel:

| Key | Default | Where it appears |
|-----|---------|-----------------|
| `entity` | `Database` | Default entity icon in the sidebar |
| `security` | `Shield` | Security section in the sidebar |
| `sun` | `Sun` | Theme toggle — light mode |
| `moon` | `Moon` | Theme toggle — dark mode |
| `system` | `Monitor` | Theme toggle — system mode |
| `view` | `Eye` | View button in list table |
| `edit` | `Pencil` | Edit button in list table |
| `delete` | `Trash2` | Delete button in list table |
| `arrowLeft` | `ArrowLeft` | Back button on show/edit pages |

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

Entity icons are set via `EntityView.icon` on the server as a string key that matches a Lucide component name. The bundled frontend automatically registers **all Lucide icons**, so any valid Lucide icon name works out of the box:

```ts
// fastify-admin/src/views/product.view.ts
class ProductView extends EntityView {
  icon = 'ShoppingCart'  // any Lucide icon name — resolved automatically
}
```

Some commonly used names by category:

| Category | Example keys |
|----------|-------------|
| People | `User`, `Users`, `UsersRound`, `CircleUser`, `UserCheck`, `UserRoundCheck` |
| Security | `ShieldUser`, `KeyRound`, `Shield`, `Lock`, `Key` |
| Products | `Package`, `Box`, `ShoppingBag`, `ShoppingCart`, `Store`, `Tag` |
| Finance | `Wallet`, `Banknote`, `CreditCard`, `Receipt` |
| Communication | `Mail`, `MessageCircle`, `Bell` |
| Analytics | `TrendingUp`, `BarChart2`, `PieChart`, `LineChart`, `Database`, `Table` |
| Content | `File`, `Folder`, `Image`, `StickyNote`, `Newspaper`, `BookOpen` |
| Navigation | `Home`, `Search`, `Settings`, `Bookmark`, `Star` |
| Tech | `Code2`, `Cloud`, `Server`, `Globe`, `Link`, `Layers` |
| Time | `Calendar`, `Ticket` |

Any unregistered key falls back to the default entity icon silently. For the full list of available names see the [Lucide icon directory](https://lucide.dev/icons/).

---

## Using Any Icon Library

The `AdminIconComponent` type is library-agnostic. Any React component that accepts optional `size` and `className` props works:

```ts
type AdminIconComponent = React.ComponentType<{
  size?: number
  className?: string
}>
```

### Lucide React (default)

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

---

## Entity Icon in `EntityView`

Set the `icon` property to any Lucide icon name (PascalCase):

```ts
// fastify-admin/src/views/product.view.ts (server)
class ProductView extends EntityView {
  icon = 'ShoppingCart'
}
```

If you need a custom icon not from Lucide, register it by name in `main.tsx`:

```ts
// apps/web/src/main.tsx (client)
import { iconRegistry } from './lib/iconRegistry'

const MyIcon: AdminIconComponent = ({ size = 16, className }) => (
  <svg width={size} height={size} className={className}>...</svg>
)

iconRegistry.registerEntityIcons({ MyIcon })
```

Then use `icon = 'MyIcon'` in the corresponding `EntityView`.

---

## Full Example — `main.tsx`

```ts
import { iconRegistry } from './lib/iconRegistry'
import { FastifyAdmin } from './lib/FastifyAdmin'

// 1. Override named UI icons (optional — these are already Lucide defaults)
import { Trash2, Pencil, Eye } from 'lucide-react'
iconRegistry.override({ delete: Trash2, edit: Pencil, view: Eye })

// 2. All Lucide icons are pre-registered automatically — no extra setup needed.
//    Custom icons can be added here if required:
// iconRegistry.registerEntityIcons({ MyCustomIcon })

// 3. Init — entity icons are resolved automatically from their string names
await FastifyAdmin.initFromApi()
```
