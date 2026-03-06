# Database & Migrations

---

## Overview

The project uses **PostgreSQL** as the database and **MikroORM** as the ORM (Object-Relational Mapper). An ORM lets you work with database records as TypeScript classes instead of writing raw SQL.

---

## Running the Database

During development, PostgreSQL runs in Docker:

```bash
docker compose up postgres -d
```

The database is accessible at `localhost:5432` with these defaults:
- Database: `fastifyadmin`
- Username: `postgres`
- Password: `password`

---

## Migrations

A **migration** is a file that describes a change to the database schema. For example, "add a `published` column to the `post` table".

Migrations are stored in `fastify-admin/src/migrations/`.

### Automatic migrations on startup

The dev server automatically runs any pending migrations when it starts. You don't need to run them manually during development.

### Creating a migration

After you change or add an entity, create a migration:

```bash
pnpm migration:create
```

MikroORM compares your entity definitions to the current database state and generates the SQL automatically. Review the generated file to make sure it looks right.

### Running migrations manually

```bash
pnpm migration:up     # apply all pending migrations
pnpm migration:down   # undo the last migration
```

---

## Database Configuration

Connection settings are in `fastify-admin/src/mikro-orm.config.ts` and read from environment variables:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fastifyadmin
DB_USER=postgres
DB_PASSWORD=password
```

---

## Resetting the Database

To completely wipe the database and start over:

```bash
docker compose down -v   # -v removes the data volume
docker compose up postgres -d
```

The next time you start the server it will re-run all migrations and re-seed the roles/permissions.

---

## MikroORM CLI

You can use the MikroORM CLI directly from the `fastify-admin` directory:

```bash
cd fastify-admin
npx mikro-orm migration:create    # create migration
npx mikro-orm migration:up        # run migrations
npx mikro-orm migration:down      # rollback
npx mikro-orm debug               # check connection and entity discovery
```

Or use the root-level shortcuts:
```bash
pnpm migration:create
pnpm migration:up
pnpm migration:down
```
