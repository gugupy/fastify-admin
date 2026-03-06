# Roles & Permissions (RBAC)

RBAC stands for **Role-Based Access Control**. It controls who can do what in the admin panel.

---

## The Basics

- A **Permission** is a specific action, like `post.create` or `user.delete`
- A **Role** is a group of permissions, like "Admin" or "Viewer"
- A **User** has one or more roles

When a user tries to do something (view a list, create a record, delete something), the system checks if their role includes the permission for that action.

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

For example, if you have a `Post` entity, these permissions are created:
- `post.list`
- `post.show`
- `post.create`
- `post.edit`
- `post.delete`

When you add a new entity, its permissions are created automatically on the next server start.

---

## Managing Roles and Users

In the admin panel sidebar, the **Security** section contains:

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

You can override the default permission names for an entity:

```ts
resources: {
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

This is useful if you want multiple entities to share a permission.

---

## Restricting Operations by Role

The `operations` config controls which operations are available at all (regardless of role). Use it to permanently disable features for an entity:

```ts
resources: {
  auditLog: {
    operations: ['list', 'show'],  // no create, edit, or delete — for anyone
  },
}
```

This is different from permissions — `operations` removes the feature from the UI entirely, while permissions checks whether the current user is allowed to use a feature that exists.

---

## How It Works in the Frontend

The `useRbac()` hook is used throughout the UI:

```ts
const { can, user } = useRbac();

if (can('post.delete')) {
  // show delete button
}
```

The current user's permissions are fetched from `/api/auth/me` when the app loads.
