import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from 'vitest'
import { buildApp, teardown } from './setup.js'
import { User } from '../index.js'

// vi.hoisted ensures these are available inside the hoisted vi.mock factory
const mockGetToken = vi.hoisted(() => vi.fn())

// Mock @fastify/oauth2 to skip the real OAuth dance.
// The plugin just needs to add the decorator with our mock function.
vi.mock('@fastify/oauth2', () => ({
  default: Object.assign(
    async (app: any, opts: any) => {
      app.decorate(opts.name, {
        getAccessTokenFromAuthorizationCodeFlow: mockGetToken,
      })
    },
    { [Symbol.for('skip-override')]: true },
  ),
}))

let ctx: Awaited<ReturnType<typeof buildApp>>

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeAll(async () => {
  // Set all three providers so their routes get registered
  process.env.GOOGLE_CLIENT_ID = 'mock-google-id'
  process.env.GOOGLE_CLIENT_SECRET = 'mock-google-secret'
  process.env.GITHUB_CLIENT_ID = 'mock-github-id'
  process.env.GITHUB_CLIENT_SECRET = 'mock-github-secret'
  process.env.MICROSOFT_CLIENT_ID = 'mock-ms-id'
  process.env.MICROSOFT_CLIENT_SECRET = 'mock-ms-secret'

  ctx = await buildApp()
})

afterAll(async () => {
  delete process.env.GOOGLE_CLIENT_ID
  delete process.env.GOOGLE_CLIENT_SECRET
  delete process.env.GITHUB_CLIENT_ID
  delete process.env.GITHUB_CLIENT_SECRET
  delete process.env.MICROSOFT_CLIENT_ID
  delete process.env.MICROSOFT_CLIENT_SECRET
  await teardown(ctx)
})

afterEach(() => {
  vi.unstubAllGlobals()
  mockGetToken.mockReset()
})

// ── /api/auth/providers ───────────────────────────────────────────────────────

describe('GET /api/auth/providers', () => {
  it('returns true for all providers when env vars are set', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/auth/providers',
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ google: true, github: true, microsoft: true })
  })
})

// ── Google OAuth callback ─────────────────────────────────────────────────────

describe('GET /api/auth/google/callback', () => {
  it('creates a new user and sets a JWT cookie', async () => {
    mockGetToken.mockResolvedValue({
      token: { access_token: 'mock-google-token' },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          id: 'g-001',
          email: 'google@example.com',
          name: 'Google User',
          verified_email: true,
        }),
      }),
    )

    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/auth/google/callback',
    })

    expect(res.statusCode).toBe(302)
    expect(res.headers['set-cookie']).toMatch(/token=/)

    const em = ctx.orm.em.fork()
    const user = await em.findOne(User, { email: 'google@example.com' })
    expect(user).not.toBeNull()
    expect(user!.fullName).toBe('Google User')
    expect(user!.oauthProvider).toBe('google')
    expect(user!.oauthId).toBe('g-001')
    expect(user!.emailVerified).toBe(true)
  })

  it('does not create a duplicate when user already exists', async () => {
    mockGetToken.mockResolvedValue({
      token: { access_token: 'mock-google-token' },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          id: 'g-001',
          email: 'google@example.com', // same email as previous test
          name: 'Google User',
        }),
      }),
    )

    await ctx.app.inject({ method: 'GET', url: '/api/auth/google/callback' })

    const em = ctx.orm.em.fork()
    const count = await em.count(User, { email: 'google@example.com' })
    expect(count).toBe(1)
  })
})

// ── GitHub OAuth callback ─────────────────────────────────────────────────────

describe('GET /api/auth/github/callback', () => {
  it('creates a new user from GitHub profile', async () => {
    mockGetToken.mockResolvedValue({
      token: { access_token: 'mock-github-token' },
    })
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          json: async () => ({
            id: 456,
            name: 'GitHub User',
            email: 'github@example.com',
          }),
        })
        .mockResolvedValueOnce({
          json: async () => [
            { email: 'github@example.com', primary: true, verified: true },
          ],
        }),
    )

    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/auth/github/callback',
    })

    expect(res.statusCode).toBe(302)
    expect(res.headers['set-cookie']).toMatch(/token=/)

    const em = ctx.orm.em.fork()
    const user = await em.findOne(User, { email: 'github@example.com' })
    expect(user).not.toBeNull()
    expect(user!.oauthProvider).toBe('github')
    expect(user!.oauthId).toBe('456')
    expect(user!.emailVerified).toBe(true)
  })

  it('uses primary verified email when user.email is null', async () => {
    mockGetToken.mockResolvedValue({
      token: { access_token: 'mock-github-token' },
    })
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          json: async () => ({ id: 789, name: 'GitHub User 2', email: null }),
        })
        .mockResolvedValueOnce({
          json: async () => [
            { email: 'primary@github.com', primary: true, verified: true },
            { email: 'other@github.com', primary: false, verified: true },
          ],
        }),
    )

    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/auth/github/callback',
    })

    expect(res.statusCode).toBe(302)

    const em = ctx.orm.em.fork()
    const user = await em.findOne(User, { email: 'primary@github.com' })
    expect(user).not.toBeNull()
  })

  it('returns 400 when no email is found on GitHub account', async () => {
    mockGetToken.mockResolvedValue({
      token: { access_token: 'mock-github-token' },
    })
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          json: async () => ({ id: 999, name: 'No Email', email: null }),
        })
        .mockResolvedValueOnce({
          json: async () => [],
        }),
    )

    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/auth/github/callback',
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().message).toBe('No email found on GitHub account.')
  })
})

// ── Microsoft OAuth callback ──────────────────────────────────────────────────

describe('GET /api/auth/microsoft/callback', () => {
  it('creates a new user from Microsoft profile using mail field', async () => {
    mockGetToken.mockResolvedValue({ token: { access_token: 'mock-ms-token' } })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          id: 'ms-001',
          displayName: 'Microsoft User',
          mail: 'microsoft@example.com',
          userPrincipalName: 'ms@tenant.onmicrosoft.com',
        }),
      }),
    )

    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/auth/microsoft/callback',
    })

    expect(res.statusCode).toBe(302)
    expect(res.headers['set-cookie']).toMatch(/token=/)

    const em = ctx.orm.em.fork()
    const user = await em.findOne(User, { email: 'microsoft@example.com' })
    expect(user).not.toBeNull()
    expect(user!.oauthProvider).toBe('microsoft')
    expect(user!.oauthId).toBe('ms-001')
    expect(user!.emailVerified).toBe(true)
  })

  it('falls back to userPrincipalName when mail is null', async () => {
    mockGetToken.mockResolvedValue({ token: { access_token: 'mock-ms-token' } })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          id: 'ms-002',
          displayName: 'Microsoft User 2',
          mail: null,
          userPrincipalName: 'upn@example.com',
        }),
      }),
    )

    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/auth/microsoft/callback',
    })

    expect(res.statusCode).toBe(302)

    const em = ctx.orm.em.fork()
    const user = await em.findOne(User, { email: 'upn@example.com' })
    expect(user).not.toBeNull()
  })
})
