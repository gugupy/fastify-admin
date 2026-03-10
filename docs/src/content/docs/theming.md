---
title: Theming
description: Light/dark mode and color customisation.
---

## Light / Dark / System Mode

| Mode | Description |
|------|-------------|
| **Light** | Always light |
| **Dark** | Always dark |
| **System** | Follows your OS setting (auto) |

The selected theme is saved in `localStorage` and persists across sessions.

---

## Switching the Theme

The theme toggle appears in two places:
1. **Sidebar** — in the user dropdown at the bottom
2. **Auth pages** — top-right corner of login/signup/MFA pages

---

## How It Works

Managed by `web/src/lib/theme.tsx`:

- Adds/removes the `dark` class on `<html>`
- Tailwind applies dark styles via the `dark:` prefix
- When set to "system", listens for OS preference changes via `matchMedia`

All components use semantic color tokens:

```
bg-background       ← white in light, dark in dark mode
text-foreground     ← dark in light, white in dark mode
bg-muted            ← subtle grey in both modes
bg-foreground       ← primary action buttons
text-background     ← text on primary action buttons
```

---

## Customising Colors

Colors are CSS variables in `web/src/index.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
}
```

---

## Admin Panel Name

```ts
await app.register(fastifyAdmin, {
  orm,
  name: 'My App',   // shown in the sidebar header
});
```
