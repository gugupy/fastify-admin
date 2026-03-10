---
title: Configuration
description: Environment variables and plugin options for fastify-admin.
---

## Environment Variables

All configuration is done through environment variables. Create a `.env` file in the `fastify-admin/` directory (never commit this file):

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fastifyadmin
DB_USER=postgres
DB_PASSWORD=password

# JWT — change this to a long random string in production!
ADMIN_JWT_SECRET=change-me-in-production

# Admin panel name (shown in the sidebar and browser tab)
ADMIN_NAME=My App Admin

# Port the API listens on
ADMIN_PORT=3001

# Used for OAuth redirect URLs
ADMIN_BASE_URL=http://localhost:3001

# Allow users to register themselves (default: false)
ADMIN_SIGNUP_ENABLED=false

# Enable MFA (users can't toggle MFA on their account when false)
ADMIN_MFA_ENABLED=false

# Require email OTP verification on signup before the user can log in
ADMIN_EMAIL_VERIFICATION=false

# Email (needed for MFA codes and signup verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=you@gmail.com
SMTP_SECURE=false

# OAuth — Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# OAuth — GitHub
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# OAuth — Microsoft
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
```

---

## Plugin Options (in `dev.ts`)

When you register the admin plugin you can pass these options:

```ts
await app.register(fastifyAdmin, {
  // Required: your MikroORM instance
  orm,

  // Display name shown in the sidebar header
  name: 'My App Admin',

  // Allow users to sign up themselves (default: false, or set ADMIN_SIGNUP_ENABLED=true)
  signup: false,

  // Entity names that are treated as "security" entities
  // They are hidden from the main nav and shown in the Security section
  securityEntities: ['user', 'role', 'permission'],

  // URL used for OAuth redirect (must match what you set in the OAuth provider)
  appBaseUrl: 'http://localhost:3001',

  // Per-entity view configuration (see adding-entities.md)
  views: {
    post: { ... },
    product: { ... },
  },
});
```

---

## Database Configuration

Database settings live in `fastify-admin/src/mikro-orm.config.ts`. Everything reads from environment variables so you never hardcode credentials:

```ts
export default defineConfig({
  dbName: process.env.DB_NAME ?? 'fastifyadmin',
  host:   process.env.DB_HOST ?? 'localhost',
  port:   parseInt(process.env.DB_PORT ?? '5432'),
  user:   process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'password',
  // ...
});
```

---

## OAuth Setup

To enable "Continue with Google/GitHub/Microsoft" buttons, you need to:

1. Create an OAuth app in the provider's developer console
2. Set the redirect URL to `http://localhost:3001/api/auth/{provider}/callback`
3. Copy the client ID and secret into your `.env`

### Google
- Go to Google Cloud Console → APIs & Services → Credentials
- Create an OAuth 2.0 Client ID
- Set redirect URI: `http://localhost:3001/api/auth/google/callback`

### GitHub
- Go to GitHub → Settings → Developer settings → OAuth Apps
- Set callback URL: `http://localhost:3001/api/auth/github/callback`

### Microsoft
- Go to Azure Portal → App registrations
- Set redirect URI: `http://localhost:3001/api/auth/microsoft/callback`

Once the environment variables are set, the login and signup pages automatically show the corresponding buttons.

---

## Disabling Features

**Disable self-signup** (admin-only user creation):
```env
ADMIN_SIGNUP_ENABLED=false
```

**Make an entity read-only** (no create/edit/delete):
```ts
views: {
  order: new class extends EntityView {
    permissions() {
      return { create: false, edit: false, delete: false }
    }
  },
}
```

**Hide an entity from the sidebar**:
```ts
views: {
  auditLog: {
    sidebar: false,
  },
}
```
