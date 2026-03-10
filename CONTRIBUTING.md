# Contributing to fastify-admin

Thanks for taking the time to contribute! This guide covers everything you need to get started.

## Table of Contents

- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Understanding the Codebase](#understanding-the-codebase)
- [Testing the Package Locally](#testing-the-package-locally)
- [Code Style](#code-style)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

---

## Project Structure

```
fastify-admin/        ← The npm package (Fastify plugin + dev server)
  src/
    plugin.ts         ← Fastify plugin entry point
    dev.ts            ← Dev server (local development only)
    EntityView.ts     ← Base class users extend to configure entities
    ViewRegistry.ts   ← Chainable registry for EntityView instances
    routes/           ← API route handlers
    entities/         ← Built-in MikroORM entities (User, Role, Permission)
    views/            ← Built-in EntityView definitions
    migrations/       ← Database migrations
    cli/              ← CLI commands (init, generate:resource, migrate, etc.)

web/                  ← React frontend (Vite + TanStack Router)
  src/
    routes/           ← Page components
    components/       ← Shared UI components
    lib/              ← Frontend logic (auth, entity registry, permissions)

website/              ← Landing page (single HTML file)
docs/                 ← Documentation site (Astro + Starlight)
```

---

## Getting Started

**Prerequisites:** Node.js 20+, pnpm, PostgreSQL

```bash
# Install dependencies
pnpm install

# Run migrations
pnpm migration:up

# Start dev server (API + frontend)
pnpm dev
```

The API runs on `http://localhost:3001` and the frontend on `http://localhost:5173`.

> **Note:** In development, the frontend is served by Vite (port 5173). The `fastify-admin/ui/` folder (used in production) does **not** exist until you run `pnpm bundle`. If you get a 404 on `http://localhost:3001`, run:
> ```bash
> pnpm bundle
> ```

---

## Understanding the Codebase

**Where to start:**

| File | What it does |
|------|-------------|
| `fastify-admin/src/plugin.ts` | Plugin entry point — routes, decorators, view registration |
| `fastify-admin/src/EntityView.ts` | Base class users extend to expose entities in the UI |
| `fastify-admin/src/ViewRegistry.ts` | Chainable registry for registering views |
| `fastify-admin/src/routes/` | Auth, CRUD, and permission route handlers |
| `web/src/routes/` | React pages (TanStack Router file-based routing) |
| `web/src/components/` | Shared UI components |

**Harder parts:**
- MikroORM entity metadata and the migration system
- Fastify plugin encapsulation (`fastify-plugin` and scope isolation)
- The RBAC seeding logic — how roles and permissions are wired together

**Easier parts:**
- `EntityView` — a simple class with overridable methods, well-contained
- React UI — standard component patterns built on shadcn/ui and TanStack Router

Reading `plugin.ts` → `EntityView.ts` → one route handler in `routes/` is the fastest path to understanding how everything connects.

---

## Testing the Package Locally

When working on the plugin, test it in a separate project as if installed from npm.

> **Before testing:** Build the frontend and copy it into the package:
> ```bash
> pnpm bundle
> ```

### Option 1 — `pnpm link` (recommended)

```bash
cd fastify-admin
pnpm build
pnpm link --global
```

In your test project:

```bash
pnpm link --global fastify-admin
```

Rebuild after each change: `pnpm build`. Unlink when done:

```bash
pnpm unlink --global fastify-admin
```

### Option 2 — Local path in `package.json`

```json
{
  "dependencies": {
    "fastify-admin": "file:/path/to/fastify-admin/fastify-admin"
  }
}
```

Rebuild and reinstall after each change.

### Option 3 — `pnpm pack` (closest to real npm install)

```bash
cd fastify-admin
pnpm build && pnpm pack
```

```bash
pnpm add /path/to/fastify-admin-x.x.x.tgz
```

Use this for a final check before publishing.

---

## Code Style

This project uses **ESLint** and **Prettier**. Run these before submitting a PR:

```bash
pnpm lint
pnpm format
```

### Rules

- **TypeScript** everywhere — no plain `.js` in `src/`
- **No `any`** — use proper types or `unknown`
- **Single quotes**, no semicolons, 2-space indent (Prettier enforced)
- **Named exports** preferred over default exports
- Keep functions small and focused

### Commit messages

Short imperative messages:

```
add lifecycle hooks to entity CRUD
fix role check on nested routes
update CLI with generate:resource command
```

---

## Submitting Changes

1. Fork the repo and create a branch: `git checkout -b my-feature`
2. Make your changes and run `pnpm lint` + `pnpm format`
3. Test locally with `pnpm dev`
4. Open a pull request with a clear description of what changed and why

For larger changes, open an issue first to discuss the approach.

---

## Reporting Issues

Open an issue on GitHub with:

- A clear title
- Steps to reproduce
- Expected vs actual behaviour
- Node.js version, OS, and fastify-admin version

---

Questions? Open a [GitHub Issue](https://github.com/gugupy/fastify-admin/issues) or email [gugu.ap900@gmail.com](mailto:gugu.ap900@gmail.com).
