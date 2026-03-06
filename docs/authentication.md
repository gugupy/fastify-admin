# Authentication

The admin panel includes a full authentication system out of the box. You don't need to build any of it yourself.

---

## Login

Users log in with their **email or username** and **password**.

The login page is at `/login`. After a successful login, the user is redirected to the dashboard.

Sessions are stored in a secure HTTP-only cookie (JWT). The session expires when the browser is closed unless the cookie is configured with a longer expiry.

---

## Signup

If `signup: true` (the default), there is a signup page at `/signup`.

When a user signs up:
1. They fill in username, full name, email, and password
2. A 6-digit verification code is sent to their email
3. They enter the code to verify their email address
4. Their account is created and they are logged in

To disable self-signup (so only admins can create accounts):
```env
SIGNUP_ENABLED=false
```

---

## Multi-Factor Authentication (MFA)

MFA is opt-in per user. When enabled for an account:

1. The user logs in with their password as usual
2. A 6-digit code is sent to their email
3. They enter the code on the verification screen
4. They are logged in

Users can enable/disable MFA from their **Profile** page (`/profile`).

---

## OAuth (Social Login)

Users can log in with Google, GitHub, or Microsoft instead of a password.

When a user logs in via OAuth for the first time, an account is automatically created for them. On subsequent logins, their existing account is matched by email.

To enable OAuth, set the relevant environment variables (see [Configuration](./configuration.md)).

---

## Password Reset

Admins can reset any user's password via the CLI:

```bash
pnpm reset-password
```

Follow the prompts — enter the user's email and a new password.

---

## Session Management

- Sessions use **JWT tokens** stored in a cookie named `token`
- The JWT secret is configured via `JWT_SECRET` environment variable
- To log out, users click "Sign out" in the sidebar dropdown

---

## Creating Users

There are two ways to create users:

**1. Via signup page** (if enabled):
Users register themselves at `/signup`.

**2. Via CLI** (always available):
```bash
pnpm create-admin
```
This creates a user and immediately assigns them the "Admin" role. Use this for the very first user or when you need to create accounts without self-signup.
