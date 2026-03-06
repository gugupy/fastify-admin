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
    routes/           ← API route handlers
    entities/         ← MikroORM entities
    migrations/       ← Database migrations
    cli/              ← create-admin, reset-password CLIs

web/                  ← React frontend (Vite + TanStack Router)
  src/
    routes/           ← Page components
    components/       ← Shared UI components

website/              ← Landing page (single HTML file)
```

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

> **Note:** In development, the frontend is served by Vite (port 5173) and proxied by the API. The `fastify-admin/ui/` folder (used in production/bundled mode) does **not** exist until you run:
> ```bash
> rm -rf fastify-admin/ui && cp -r web/dist fastify-admin/ui
> ```
> You only need this when testing the plugin as it would be used in production (e.g. via the `test-app`). If you get a 404 on `http://localhost:3001`, this is why.

## Understanding the Codebase

**Where to start:**

| File | What it does |
|------|-------------|
| `fastify-admin/src/plugin.ts` | Plugin entry point — how routes and decorators are registered |
| `fastify-admin/src/AdminResource.ts` | Core abstraction users subclass to configure entities |
| `fastify-admin/src/routes/` | Auth, CRUD, and permission route handlers |
| `web/src/routes/` | React pages (TanStack Router file-based routing) |
| `web/src/components/` | Shared UI components |

**Harder parts to get up to speed on:**
- MikroORM entity metadata and the migration system
- Fastify plugin encapsulation (`fastify-plugin` and scope isolation)
- The RBAC seeding logic — how roles and permissions are wired together

**Easier parts:**
- `AdminResource` — a simple class with overridable methods, well-contained
- React UI — standard component patterns built on shadcn/ui and TanStack Router

**Rough estimate for new contributors:**
- Comfortable with Fastify + TypeScript: **1–2 days**
- Newer to Fastify or MikroORM: **3–5 days**

Reading `plugin.ts` → `AdminResource.ts` → one route handler in `routes/` is the fastest path to understanding how everything connects.

## Testing the Package Locally

When working on the plugin itself, you'll want to test it in a separate project as if it were installed from npm. There are three ways to do this.

> **Before testing:** The plugin serves the admin UI from `fastify-admin/ui/`. This folder only exists after you build the frontend. Run this once before starting your test app:
> ```bash
> rm -rf fastify-admin/ui && cp -r web/dist fastify-admin/ui
> ```

### Option 1 — `pnpm link` (recommended for active development)

Build the package and link it globally:

```bash
cd fastify-admin   # the package directory
pnpm build
pnpm link --global
```

In your test project:

```bash
cd /path/to/my-test-project
pnpm link --global fastify-admin
```

Changes you make to the source require a rebuild (`pnpm build`) to take effect. Unlink when done:

```bash
pnpm unlink --global fastify-admin
```

### Option 2 — Local path in `package.json`

Point directly to the package folder from your test project:

```json
{
  "dependencies": {
    "fastify-admin": "file:/path/to/fastify-admin/fastify-admin"
  }
}
```

Run `pnpm install` to install it. Note: you need to **rebuild and reinstall** every time you make a change.

### Option 3 — `pnpm pack` (closest to real npm install)

Pack the package into a tarball and install it like a real release:

```bash
cd fastify-admin
pnpm build
pnpm pack
# outputs fastify-admin-x.x.x.tgz
```

In your test project:

```bash
pnpm add /path/to/fastify-admin/fastify-admin/fastify-admin-x.x.x.tgz
```

Use this for a final check before publishing to npm.

---

## Code Style

This project uses **ESLint** and **Prettier**. Please run these before submitting a PR.

```bash
# Lint all packages
pnpm lint

# Format all packages
pnpm format
```

### Style rules

- **TypeScript** everywhere — no plain `.js` files in `src/`
- **No `any`** — use proper types or `unknown`; ESLint will warn on `any`
- **Single quotes**, no semicolons, 2-space indent (enforced by Prettier)
- **Trailing commas** in multi-line expressions (`es5` style)
- **Named exports** preferred over default exports in route/component files
- Keep functions small and focused — prefer composition over large classes

### Commit messages

Use short imperative messages:

```
add lifecycle hooks to entity CRUD
fix role check on nested routes
update roadmap with ORM adapters
```

## Submitting Changes

1. Fork the repo and create a branch: `git checkout -b my-feature`
2. Make your changes and run `pnpm lint` + `pnpm format`
3. Test your changes locally with `pnpm dev`
4. Open a pull request with a clear description of what changed and why

For larger changes (new features, breaking changes), open an issue first to discuss the approach.

## Reporting Issues

Open an issue on GitHub with:

- A clear title
- Steps to reproduce
- Expected vs actual behaviour
- Node.js version, OS, and fastify-admin version

---

Questions? Reach out via [GitHub Issues](https://github.com/gugupy/fastify-admin/issues) or email [gugu.ap900@gmail.com](mailto:gugu.ap900@gmail.com).
