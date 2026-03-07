import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { buildApp, teardown } from './setup.js'
import { createHelpers } from './helpers.js'
import { sendMfaCode } from '../lib/mailer.js'
import { User } from '../index.js'

// Prevent real emails during tests
vi.mock('../lib/mailer.js', () => ({ sendMfaCode: vi.fn() }))

const mockSendMfaCode = vi.mocked(sendMfaCode)

let ctx: Awaited<ReturnType<typeof buildApp>>
let authCookie: string
let profileCookie: string
let pwdCookie: string
let mfaCookie: string
let h: ReturnType<typeof createHelpers>

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeAll(async () => {
  ctx = await buildApp()
  h = createHelpers(() => ctx)

  // Seed: pre-existing user — used in taken-username, duplicate-email, and login tests
  await h.signup('existing', 'existing@example.com')

  // Seed: authenticated user — cookie reused in /me and auth guard tests
  await h.signup('authuser', 'auth@example.com')
  const loginRes = await h.login('auth@example.com')
  authCookie = h.cookieFrom(loginRes)

  // Seed: profile user — used in profile update tests
  await h.signup('profileuser', 'profile@example.com')
  profileCookie = h.cookieFrom(await h.login('profile@example.com'))

  // Seed: password user — used in password change tests
  await h.signup('pwduser', 'pwd@example.com')
  pwdCookie = h.cookieFrom(await h.login('pwd@example.com'))

  // Seed: MFA user — used in MFA enable/verify tests
  await h.signup('mfauser', 'mfa@example.com')
  mfaCookie = h.cookieFrom(await h.login('mfa@example.com'))
})

afterAll(async () => {
  await teardown(ctx)
})

// ── Check username availability ───────────────────────────────────────────────

describe('GET /api/auth/check-username', () => {
  it('returns unavailable for username shorter than 5 characters', async () => {
    const res = await h.checkUsername('less')
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ available: false })
  })

  it('returns available for a valid unused username', async () => {
    const res = await h.checkUsername('newuser')
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ available: true })
  })

  it('returns unavailable when username is already taken', async () => {
    const res = await h.checkUsername('existing')
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ available: false })
  })
})

// ── Signup ────────────────────────────────────────────────────────────────────

describe('POST /api/auth/signup', () => {
  it('creates a user and sets a JWT cookie', async () => {
    const res = await h.signup('signup1', 'signup1@example.com')
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ ok: true, requiresVerification: false })
    expect(res.headers['set-cookie']).toMatch(/token=/)
  })

  it('returns 409 if email already in use', async () => {
    const res = await h.signup('other', 'existing@example.com')
    expect(res.statusCode).toBe(409)
    expect(res.json().message).toBe('Email already in use.')
  })
})

// ── Login ─────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('returns JWT cookie when logging in with email', async () => {
    const res = await h.login('existing@example.com')
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ ok: true })
    expect(res.headers['set-cookie']).toMatch(/token=/)
  })

  it('returns JWT cookie when logging in with username', async () => {
    const res = await h.login('existing')
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ ok: true })
    expect(res.headers['set-cookie']).toMatch(/token=/)
  })

  it('returns 401 for wrong password', async () => {
    const res = await h.login('existing@example.com', 'wrongpassword')
    expect(res.statusCode).toBe(401)
    expect(res.json().message).toBe('Invalid credentials.')
  })

  it('returns 401 for non-existent email', async () => {
    const res = await h.login('nobody@example.com')
    expect(res.statusCode).toBe(401)
  })

  it('returns 401 for non-existent username', async () => {
    const res = await h.login('nobody')
    expect(res.statusCode).toBe(401)
  })
})

// ── /me ───────────────────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  it('returns user info when authenticated', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie: authCookie },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.username).toBe('authuser')
    expect(body.email).toBe('auth@example.com')
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
    const loginRes = await h.login('auth@example.com')
    const cookie = h.cookieFrom(loginRes)

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
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/admin-config',
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.name).toBe('Test Admin')
    expect(body.signup).toBe(true)
    expect(typeof body.entities).toBe('object')
  })
})

// ── Entity list ───────────────────────────────────────────────────────────────

describe('GET /api/entities', () => {
  it('returns entity metadata (name and fields) for all registered entities', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/entities',
      headers: { cookie: authCookie },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(Array.isArray(body)).toBe(true)
    // user, role, permission are always registered
    const names = body.map((e: any) => e.name)
    expect(names).toContain('user')
    expect(names).toContain('role')
    expect(names).toContain('permission')
    // each entry has name and fields array
    for (const entity of body) {
      expect(typeof entity.name).toBe('string')
      expect(Array.isArray(entity.fields)).toBe(true)
    }
  })

  it('returns 401 without authentication', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/api/entities' })
    expect(res.statusCode).toBe(401)
  })
})

// ── Auth guard ────────────────────────────────────────────────────────────────

describe('API auth guard', () => {
  it('returns 401 on protected routes without a cookie', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/api/dashboard' })
    expect(res.statusCode).toBe(401)
  })

  it('allows access with a valid cookie', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/dashboard',
      headers: { cookie: authCookie },
    })
    expect(res.statusCode).toBe(200)
  })
})

// ── OAuth providers ───────────────────────────────────────────────────────────

describe('GET /api/auth/providers', () => {
  it('returns provider flags (all false when env vars are absent)', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/auth/providers',
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({
      google: false,
      github: false,
      microsoft: false,
    })
  })
})

// ── Signup — username conflict ────────────────────────────────────────────────

describe('POST /api/auth/signup — username conflict', () => {
  it('returns 409 if username is already taken', async () => {
    const res = await h.signup('existing', 'unique@example.com')
    expect(res.statusCode).toBe(409)
    expect(res.json().message).toBe('Username already taken.')
  })
})

// ── Profile ───────────────────────────────────────────────────────────────────

describe('PUT /api/auth/profile', () => {
  it('updates fullName and bio', async () => {
    const res = await ctx.app.inject({
      method: 'PUT',
      url: '/api/auth/profile',
      headers: { cookie: profileCookie },
      payload: { fullName: 'Updated Name', bio: 'My bio' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ ok: true })

    const me = await ctx.app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie: profileCookie },
    })
    expect(me.json().fullName).toBe('Updated Name')
    expect(me.json().bio).toBe('My bio')
  })

  it('returns 401 when not authenticated', async () => {
    const res = await ctx.app.inject({
      method: 'PUT',
      url: '/api/auth/profile',
      payload: { fullName: 'Ghost' },
    })
    expect(res.statusCode).toBe(401)
  })
})

// ── Password change ───────────────────────────────────────────────────────────

describe('PUT /api/auth/password', () => {
  it('changes password when current password is correct', async () => {
    const res = await ctx.app.inject({
      method: 'PUT',
      url: '/api/auth/password',
      headers: { cookie: pwdCookie },
      payload: {
        currentPassword: 'password123',
        newPassword: 'newpassword456',
      },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ ok: true })

    // Can log in with new password
    const loginRes = await h.login('pwd@example.com', 'newpassword456')
    expect(loginRes.statusCode).toBe(200)
  })

  it('returns 401 when current password is incorrect', async () => {
    const res = await ctx.app.inject({
      method: 'PUT',
      url: '/api/auth/password',
      headers: { cookie: pwdCookie },
      payload: {
        currentPassword: 'wrongpassword',
        newPassword: 'doesntmatter',
      },
    })
    expect(res.statusCode).toBe(401)
    expect(res.json().message).toBe('Current password is incorrect.')
  })

  it('returns 401 when not authenticated', async () => {
    const res = await ctx.app.inject({
      method: 'PUT',
      url: '/api/auth/password',
      payload: { currentPassword: 'password123', newPassword: 'newpassword' },
    })
    expect(res.statusCode).toBe(401)
  })
})

// ── MFA toggle ────────────────────────────────────────────────────────────────

describe('PUT /api/auth/mfa', () => {
  it('enables MFA for the authenticated user', async () => {
    const res = await ctx.app.inject({
      method: 'PUT',
      url: '/api/auth/mfa',
      headers: { cookie: mfaCookie },
      payload: { enabled: true },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ ok: true, mfaEnabled: true })
  })

  it('disables MFA and clears pending codes', async () => {
    const res = await ctx.app.inject({
      method: 'PUT',
      url: '/api/auth/mfa',
      headers: { cookie: mfaCookie },
      payload: { enabled: false },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ ok: true, mfaEnabled: false })
  })

  it('returns 401 when not authenticated', async () => {
    const res = await ctx.app.inject({
      method: 'PUT',
      url: '/api/auth/mfa',
      payload: { enabled: true },
    })
    expect(res.statusCode).toBe(401)
  })
})

// ── MFA login flow ────────────────────────────────────────────────────────────

describe('POST /api/auth/mfa/verify', () => {
  let mfaUserId: number

  beforeAll(async () => {
    // Get the mfauser's id
    const me = await ctx.app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie: mfaCookie },
    })
    mfaUserId = me.json().id

    // Enable MFA
    await ctx.app.inject({
      method: 'PUT',
      url: '/api/auth/mfa',
      headers: { cookie: mfaCookie },
      payload: { enabled: true },
    })
  })

  it('returns 202 with mfaRequired when MFA-enabled user logs in', async () => {
    const res = await h.login('mfa@example.com')
    expect(res.statusCode).toBe(202)
    expect(res.json()).toMatchObject({ mfaRequired: true, userId: mfaUserId })
  })

  it('grants a JWT cookie with the correct MFA code', async () => {
    mockSendMfaCode.mockClear()
    await h.login('mfa@example.com')
    const code = mockSendMfaCode.mock.calls[0][1]

    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/mfa/verify',
      payload: { userId: mfaUserId, code },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ ok: true })
    expect(res.headers['set-cookie']).toMatch(/token=/)
  })

  it('returns 401 for an invalid MFA code', async () => {
    await h.login('mfa@example.com')

    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/mfa/verify',
      payload: { userId: mfaUserId, code: '000000' },
    })
    expect(res.statusCode).toBe(401)
    expect(res.json().message).toBe('Invalid code.')
  })

  it('returns 400 when there is no pending MFA challenge', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/mfa/verify',
      payload: { userId: 999999, code: '123456' },
    })
    expect(res.statusCode).toBe(400)
    expect(res.json().message).toBe('No pending MFA challenge.')
  })

  it('returns 400 with "Code expired" message when MFA code has expired', async () => {
    // Trigger MFA login to generate a pending code
    await h.login('mfa@example.com')

    // Manually expire the code in the DB
    const em = ctx.orm.em.fork()
    const user = await em.findOneOrFail(User, { id: mfaUserId })
    user.mfaCodeExpiresAt = new Date(Date.now() - 1000) // 1 second in the past
    await em.flush()

    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/mfa/verify',
      payload: { userId: mfaUserId, code: '123456' },
    })
    expect(res.statusCode).toBe(400)
    expect(res.json().message).toBe('Code expired. Please sign in again.')
  })
})

// ── Valid JWT but user deleted from DB ────────────────────────────────────────

describe('Routes with a stale JWT (user deleted from DB)', () => {
  let ghostCookie: string

  beforeAll(async () => {
    await h.signup('ghostuser', 'ghost@example.com')
    const loginRes = await h.login('ghost@example.com')
    ghostCookie = h.cookieFrom(loginRes)

    // Delete the user so the JWT is now stale
    const em = ctx.orm.em.fork()
    const user = await em.findOneOrFail(User, { email: 'ghost@example.com' })
    await em.removeAndFlush(user)
  })

  it('GET /api/auth/me returns 401', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie: ghostCookie },
    })
    expect(res.statusCode).toBe(401)
  })

  it('PUT /api/auth/profile returns 401', async () => {
    const res = await ctx.app.inject({
      method: 'PUT',
      url: '/api/auth/profile',
      headers: { cookie: ghostCookie },
      payload: { fullName: 'Ghost' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('PUT /api/auth/password returns 401', async () => {
    const res = await ctx.app.inject({
      method: 'PUT',
      url: '/api/auth/password',
      headers: { cookie: ghostCookie },
      payload: { currentPassword: 'password123', newPassword: 'newpassword' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('PUT /api/auth/mfa returns 401', async () => {
    const res = await ctx.app.inject({
      method: 'PUT',
      url: '/api/auth/mfa',
      headers: { cookie: ghostCookie },
      payload: { enabled: true },
    })
    expect(res.statusCode).toBe(401)
  })
})
