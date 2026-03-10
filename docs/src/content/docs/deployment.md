---
title: Deployment
description: Deploy fastify-admin to production with Docker Compose.
---

## Using Docker Compose (Recommended)

### Step 1 — Build the frontend

```bash
pnpm bundle
```

This compiles the React app and embeds it inside the `fastify-admin` package so the API server can serve it.

### Step 2 — Set production environment variables

```env
DB_HOST=postgres
DB_NAME=fastifyadmin
DB_USER=postgres
DB_PASSWORD=your-strong-password-here

ADMIN_JWT_SECRET=a-very-long-random-string-here

ADMIN_NAME=My App
ADMIN_PORT=3001
ADMIN_BASE_URL=https://your-domain.com
ADMIN_SIGNUP_ENABLED=false

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=your-email-password
SMTP_FROM=noreply@example.com
```

### Step 3 — Deploy

```bash
docker compose up -d
```

### Step 4 — Create the first admin user

```bash
docker compose exec api pnpm create-admin
```

---

## Production Checklist

- [ ] Change `ADMIN_JWT_SECRET` to a long random string (at least 32 characters)
- [ ] Use a strong database password
- [ ] Set `ADMIN_SIGNUP_ENABLED=false`
- [ ] Configure a real SMTP server
- [ ] Set `ADMIN_BASE_URL` to your actual domain
- [ ] Enable HTTPS via a reverse proxy (Nginx or Caddy)

---

## Serving Behind a Reverse Proxy

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

In production, the API serves both the API and the pre-built web UI from port 3001.

---

## Environment Summary

| Setting | Development | Production |
|---------|------------|------------|
| Frontend | Vite dev server (port 5173) | Bundled into API (port 3001) |
| Database | Docker on localhost | Managed DB or Docker |
| HTTPS | Not needed | Required |
| Signup | Enabled | Disable after setup |
