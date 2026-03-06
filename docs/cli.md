# CLI Commands

All commands are run from the **project root** directory.

---

## Development

```bash
pnpm dev            # Start API + web app together
pnpm dev:api        # Start only the API server (port 3001)
pnpm dev:web        # Start only the web app (port 5173)
```

---

## User Management

```bash
pnpm create-admin
```
Creates a new user and assigns them the Admin role. You'll be prompted for:
- Email address
- Full name
- Password (minimum 8 characters)

```bash
pnpm reset-password
```
Resets the password for an existing user. You'll be prompted for the user's email and a new password.

---

## Database Migrations

```bash
pnpm migration:create   # Generate a new migration from entity changes
pnpm migration:up       # Apply all pending migrations
pnpm migration:down     # Roll back the most recent migration
```

---

## Building & Publishing

```bash
pnpm build:web      # Build the React frontend into web/dist/
pnpm build:package  # Compile TypeScript for the fastify-admin package

pnpm bundle         # Full build: web → copy to fastify-admin/ui/ → compile TS
                    # Run this before publishing or deploying

pnpm release        # Bundle + publish to npm (requires npm login)
```

### What `pnpm bundle` does step by step:

1. Builds the React app (`web/dist/`)
2. Copies the built files into `fastify-admin/ui/`
3. Compiles the TypeScript package (`fastify-admin/dist/`)

After bundling, the `fastify-admin` package is self-contained — it includes the pre-built UI and can be used without the `web/` folder.

---

## Docker

```bash
docker compose up -d              # Start all services (postgres, api, web)
docker compose up postgres -d     # Start only the database
docker compose down               # Stop all services
docker compose down -v            # Stop all services AND delete the database data
docker compose logs api -f        # Watch API logs
docker compose logs web -f        # Watch web logs
```
