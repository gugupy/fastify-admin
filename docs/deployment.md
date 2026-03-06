# Deployment

---

## Using Docker Compose (Recommended)

The easiest way to deploy is with Docker Compose. It runs everything together: the database, API, and web app.

### Step 1 — Build the frontend first

```bash
pnpm bundle
```

This compiles the React app and embeds it inside the `fastify-admin` package so the API server can serve it.

### Step 2 — Set production environment variables

Create a `.env` file (or set variables in your hosting platform):

```env
DB_HOST=postgres
DB_NAME=fastifyadmin
DB_USER=postgres
DB_PASSWORD=your-strong-password-here

JWT_SECRET=a-very-long-random-string-here

ADMIN_NAME=My App
SIGNUP_ENABLED=false    # disable in production if you don't want public signup

APP_BASE_URL=https://your-domain.com

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

Before going live:

- [ ] Change `JWT_SECRET` to a long random string (at least 32 characters)
- [ ] Use a strong database password
- [ ] Set `SIGNUP_ENABLED=false` if you don't want anyone to create accounts
- [ ] Configure a real SMTP server for email (MFA codes, signup verification)
- [ ] Set `APP_BASE_URL` to your actual domain
- [ ] Enable HTTPS (use a reverse proxy like Nginx or Caddy in front)

---

## Serving Behind a Reverse Proxy

In production you typically put Nginx or Caddy in front to handle HTTPS. Example Nginx config:

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

In production, the API server serves both the API and the pre-built web UI from the same port (3001).

---

## Environment-Specific Notes

| Setting | Development | Production |
|---------|------------|------------|
| Frontend | Vite dev server (port 5173) | Bundled into API (port 3001) |
| Database | Docker on localhost | Managed DB or Docker |
| HTTPS | Not needed | Required |
| Signup | Enabled | Disable after setup |
| Debug logs | On | Off (set `NODE_ENV=production`) |
