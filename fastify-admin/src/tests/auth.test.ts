import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { buildApp, teardown } from './setup.js'

// Prevent real emails during tests
vi.mock('../lib/mailer.js', () => ({ sendMfaCode: vi.fn() }))

let ctx: Awaited<ReturnType<typeof buildApp>>

beforeAll(async () => {
  ctx = await buildApp()
})

afterAll(async () => {
  await teardown(ctx)
})

// ── Helpers ───────────────────────────────────────────────────────────────────

async function signup(email = 'test@example.com', password = 'password123') {
  return ctx.app.inject({
    method: 'POST',
    url: '/api/auth/signup',
    payload: { fullName: 'Test User', email, password },
  })
}

async function login(email = 'test@example.com', password = 'password123') {
  return ctx.app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email, password },
  })
}

function cookieFrom(res: Awaited<ReturnType<typeof login>>) {
  return res.headers['set-cookie'] as string
}

// ── Signup ────────────────────────────────────────────────────────────────────

describe('POST /api/auth/signup', () => {
  it('creates a user and sets a JWT cookie', async () => {
    const res = await signup('signup1@example.com')
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ ok: true, requiresVerification: false })
    expect(res.headers['set-cookie']).toMatch(/token=/)
  })

  it('returns 409 if email already in use', async () => {
    await signup('dup@example.com')
    const res = await signup('dup@example.com')
    expect(res.statusCode).toBe(409)
    expect(res.json().message).toBe('Email already in use.')
  })
})

// ── Login ─────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('returns JWT cookie on valid credentials', async () => {
    await signup('login1@example.com')
    const res = await login('login1@example.com')
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ ok: true })
    expect(res.headers['set-cookie']).toMatch(/token=/)
  })

  it('returns 401 for wrong password', async () => {
    await signup('login2@example.com')
    const res = await login('login2@example.com', 'wrongpassword')
    expect(res.statusCode).toBe(401)
    expect(res.json().message).toBe('Invalid credentials.')
  })

  it('returns 401 for unknown email', async () => {
    const res = await login('nobody@example.com')
    expect(res.statusCode).toBe(401)
  })
})

// ── /me ───────────────────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  it('returns user info when authenticated', async () => {
    await signup('me1@example.com')
    const loginRes = await login('me1@example.com')
    const cookie = cookieFrom(loginRes)

    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.email).toBe('me1@example.com')
    expect(body.fullName).toBe('Test User')
    expect(Array.isArray(body.permissions)).toBe(true)
  })

  it('returns 401 when not authenticated', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/api/auth/me' })
    expect(res.statusCode).toBe(401)
  })
})

// ── Logout ────────────────────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  it('clears the token cookie', async () => {
    await signup('logout1@example.com')
    const loginRes = await login('logout1@example.com')
    const cookie = cookieFrom(loginRes)

    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: { cookie },
    })
    expect(res.statusCode).toBe(200)
    expect(res.headers['set-cookie']).toMatch(/token=;/)
  })
})

// ── Admin config ──────────────────────────────────────────────────────────────

describe('GET /api/admin-config', () => {
  it('is publicly accessible and returns config shape', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/api/admin-config' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.name).toBe('Test Admin')
    expect(body.signup).toBe(true)
    expect(typeof body.entities).toBe('object')
  })
})

// ── Auth guard ────────────────────────────────────────────────────────────────

describe('API auth guard', () => {
  it('returns 401 on protected routes without a cookie', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/api/dashboard' })
    expect(res.statusCode).toBe(401)
  })

  it('allows access with a valid cookie', async () => {
    await signup('guard1@example.com')
    const loginRes = await login('guard1@example.com')
    const cookie = cookieFrom(loginRes)

    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/dashboard',
      headers: { cookie },
    })
    expect(res.statusCode).toBe(200)
  })
})
