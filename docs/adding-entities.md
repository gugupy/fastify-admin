# Adding Entities

An "entity" is a data model — like a `Post`, `Product`, `Order`, or `Customer`. When you add one, the admin panel automatically generates a full CRUD interface for it (list, view, create, edit, delete).

---

## The Simplest Case

**Step 1 — Create a MikroORM entity**

Add a file in `fastify-admin/src/entities/`:

```ts
// fastify-admin/src/entities/post.entity.ts
import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class Post {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property({ type: 'text' })
  content!: string;

  @Property({ default: false })
  published = false;
}
```

**Step 2 — Create a migration**

```bash
pnpm migration:create
```

This generates a migration file in `fastify-admin/src/migrations/`. The migration is applied automatically next time you start the server.

That's it. Restart `pnpm dev` and you'll see "Post" in the sidebar with a full list/create/edit/delete UI.

---

## Customising How an Entity Looks

By default, the UI shows all fields and enables all operations. You can customise this in `fastify-admin/src/dev.ts` by adding a resource config:

```ts
await app.register(fastifyAdmin, {
  orm,
  resources: {
    post: {
      label: 'Blog Posts',           // display name in the sidebar
      icon: 'Document',              // icon from HugeIcons
      list: {
        columns: ['id', 'title', 'published'],  // which columns to show in the table
      },
      show: {
        fields: ['id', 'title', 'content', 'published'],
      },
      edit: {
        fields: ['title', 'content', 'published'],
      },
      add: {
        fields: ['title', 'content'],
      },
      operations: ['list', 'show', 'create', 'edit', 'delete'],  // all enabled by default
    },
  },
});
```

### Available operations

| Value | What it does |
|-------|-------------|
| `list` | Shows the table view with all records |
| `show` | Enables the "View" button and detail page |
| `create` | Enables the "New" button and create form |
| `edit` | Enables the "Edit" button and edit form |
| `delete` | Enables the "Delete" button and bulk delete |

To make an entity read-only:
```ts
post: {
  operations: ['list', 'show'],
}
```

---

## Using the AdminResource Class (Optional)

Instead of a plain object, you can use the `AdminResource` base class. This gives you type safety and autocompletion:

```ts
// fastify-admin/src/resources/PostResource.ts
import { AdminResource } from '../AdminResource.js';

export class PostResource extends AdminResource {
  label = 'Blog Posts';
  icon = 'Document';

  listColumns() {
    return ['id', 'title', 'published'];
  }

  showFields() {
    return ['id', 'title', 'content', 'published'];
  }

  editFields() {
    return ['title', 'content', 'published'];
  }

  addFields() {
    return ['title', 'content'];
  }
}
```

Then use it in `dev.ts`:
```ts
import { PostResource } from './resources/PostResource.js';

resources: {
  post: new PostResource(),
}
```

---

## Hiding an Entity from the Sidebar

```ts
post: {
  sidebar: false,
}
```

The entity is still accessible via URL but won't show in navigation.

---

## Custom Row Actions

You can add extra buttons to each row in the list table:

```ts
post: {
  actions: [
    {
      label: 'Publish',
      handler: async (id, model) => {
        await fetch(`/api/${model}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ published: true }),
        });
      },
      confirm: 'Are you sure you want to publish this post?',  // optional confirmation dialog
    },
  ],
}
```

---

## Field Types

MikroORM field types are automatically mapped to UI inputs:

| MikroORM type | UI input |
|---------------|----------|
| `string` / `varchar` | Text input |
| `text` | Textarea |
| `boolean` | Checkbox |
| `number` / `integer` | Number input |
| `Date` / `datetime` | Date/time input |
| Relation (`ManyToOne`, `ManyToMany`) | Select / multi-select |

---

## Relationships

MikroORM relations work automatically. For example, a `Post` that belongs to a `Category`:

```ts
@ManyToOne(() => Category)
category!: Category;
```

The edit form will show a dropdown of all categories.
