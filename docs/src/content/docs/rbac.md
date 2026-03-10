---
title: Roles & Permissions
description: Role-Based Access Control — how to manage who can do what.
---

RBAC stands for **Role-Based Access Control**. It controls who can do what in the admin panel.

---

## The Basics

- A **Permission** is a specific action, like `post.create` or `user.delete`
- A **Role** is a group of permissions, like "Admin" or "Viewer"
- A **User** has one or more roles

---

## Default Roles

Two roles are automatically created on first startup:

| Role | What it can do |
|------|---------------|
| **Admin** | Everything — all operations on all entities |
| **Viewer** | Read-only — can list and view records, but cannot create, edit, or delete |

---

## Default Permissions

Permissions are auto-generated for every entity in the format `{entity}.{operation}`.

For example, if you have a `Post` entity:
- `post.list`
- `post.show`
- `post.create`
- `post.edit`
- `post.delete`

New entity permissions are created automatically on the next server start.

---

## Managing Roles and Users

In the sidebar, the **Security** section contains:

- **Users** — manage user accounts (change names, assign roles)
- **Roles** — view roles and their permissions
- **Permissions** — view all permissions (read-only, auto-managed)

To give a user the Admin role:
1. Go to Security → Users
2. Click Edit on the user
3. Add the "Admin" role in the roles field
4. Save

---

## Custom Permissions

```ts
views: {
  post: {
    permissions: {
      list:   'content.view',
      show:   'content.view',
      create: 'content.write',
      edit:   'content.write',
      delete: 'content.delete',
    },
  },
}
```

---

## How It Works in the Frontend

```ts
const { can, user } = useRbac();

if (can('post.delete')) {
  // show delete button
}
```

The current user's permissions are fetched from `/api/auth/me` when the app loads.
