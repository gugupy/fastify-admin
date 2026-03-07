# Theming

---

## Light / Dark / System Mode

The admin panel supports three theme modes:

| Mode | Description |
|------|-------------|
| **Light** | Always light |
| **Dark** | Always dark |
| **System** | Follows your OS setting (auto) |

The selected theme is saved in the browser (`localStorage`) so it persists across page refreshes and sessions.

---

## Switching the Theme

The theme toggle appears in two places:
1. **Sidebar** — in the user dropdown menu at the bottom of the sidebar
2. **Auth pages** — in the top-right corner of the login, signup, and MFA pages

The toggle shows three icon buttons: sun (light), computer (system), moon (dark).

---

## How It Works (for developers)

The theme is managed by `web/src/lib/theme.tsx`:

- It adds or removes the `dark` class on the `<html>` element
- Tailwind CSS uses this class to apply dark styles via the `dark:` prefix
- When set to "system", it listens for OS preference changes via `matchMedia`

All UI components use **semantic color tokens** instead of hardcoded colors:

```
bg-background       ← white in light, dark in dark mode
text-foreground     ← dark in light, white in dark mode
bg-muted            ← subtle grey in both modes
bg-foreground       ← used for primary action buttons
text-background     ← text on primary action buttons
```

This means most components automatically work in both modes without any extra code.

---

## Customising Colors

Colors are defined as CSS variables in `web/src/index.css`. You can change them to match your brand:

```css
:root {
  --background: 0 0% 100%;      /* page background */
  --foreground: 222.2 84% 4.9%; /* main text */
  --primary: 221.2 83.2% 53.3%; /* primary button color */
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

---

## Admin Panel Name and Icon

The name and icon shown in the sidebar header come from the plugin config:

```ts
await app.register(fastifyAdmin, {
  orm,
  name: 'My App',   // shown in the sidebar header
  // icon is configured in web/src/lib/FastifyAdmin.ts
});
```
