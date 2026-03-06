# Getting Started

This guide will get you from zero to a running admin panel in a few minutes.

---

## What You Need Before Starting

Make sure you have these installed on your computer:

| Tool | Version | How to check |
|------|---------|--------------|
| Node.js | 20 or newer | `node --version` |
| pnpm | 10 or newer | `pnpm --version` |
| Docker | any recent | `docker --version` |
| Docker Compose | any recent | `docker compose version` |

If you don't have pnpm: `npm install -g pnpm`

---

## Step 1 — Clone and Install

```bash
git clone <repo-url> my-admin
cd my-admin
pnpm install
```

This installs all dependencies for all parts of the project at once.

---

## Step 2 — Start the Database

The project uses PostgreSQL. Docker Compose handles it for you:

```bash
docker compose up postgres -d
```

This starts a PostgreSQL database in the background. You only need to do this once (it keeps running until you stop it or restart your computer).

---

## Step 3 — Start the App

```bash
pnpm dev
```

This starts two things at the same time:
- **API server** on `http://localhost:3001` — handles data, auth, and business logic
- **Web app** on `http://localhost:5173` — the admin UI you see in the browser

Open `http://localhost:5173` in your browser.

---

## Step 4 — Create Your First Admin User

The database is empty, so you need to create a user to log in with:

```bash
pnpm create-admin
```

Follow the prompts — it asks for your email, full name, and a password (minimum 8 characters). The user is automatically given the "Admin" role.

---

## Step 5 — Log In

Go to `http://localhost:5173`, enter your email/username and password. You should see the admin dashboard.

---

## What Happens on First Start

When the API server boots for the first time it automatically:
1. Runs database migrations (creates all the tables)
2. Seeds RBAC — creates "Admin" and "Viewer" roles and all permissions

You don't need to do anything manually.

---

## Stopping Everything

```bash
# Stop the web and API processes
Ctrl+C in the terminal where you ran pnpm dev

# Stop the database
docker compose down
```

To destroy the database and start fresh:
```bash
docker compose down -v
```

---

## Next Steps

- [Project Structure](./project-structure.md) — understand what each folder does
- [Adding Entities](./adding-entities.md) — add your own data models
- [Configuration](./configuration.md) — customize the admin panel
