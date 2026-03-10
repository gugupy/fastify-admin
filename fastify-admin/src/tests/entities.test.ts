import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { buildApp, teardown } from './setup.js'
import { createHelpers } from './helpers.js'

vi.mock('../lib/mailer.js', () => ({ sendMfaCode: vi.fn() }))

let ctx: Awaited<ReturnType<typeof buildApp>>
let h: ReturnType<typeof createHelpers>
let cookie: string

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeAll(async () => {
  ctx = await buildApp()
  h = createHelpers(() => ctx)

  await h.signup('entityuser', 'entityuser@example.com')
  const loginRes = await h.login('entityuser@example.com')
  cookie = h.cookieFrom(loginRes)
})

afterAll(async () => {
  await teardown(ctx)
})

// ── GET /api/role ─────────────────────────────────────────────────────────────

describe('GET /api/role', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/api/role' })
    expect(res.statusCode).toBe(401)
  })

  it('returns list of roles', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/role',
      headers: { cookie },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(Array.isArray(body)).toBe(true)
    // seedRbac always creates the Admin role
    expect(body.some((r: any) => r.name === 'Admin')).toBe(true)
  })
})

// ── GET /api/role/:id ─────────────────────────────────────────────────────────

describe('GET /api/role/:id', () => {
  it('returns a role by id', async () => {
    // First get all roles to find the Admin role id
    const listRes = await ctx.app.inject({
      method: 'GET',
      url: '/api/role',
      headers: { cookie },
    })
    const adminRole = listRes.json().find((r: any) => r.name === 'Admin')

    const res = await ctx.app.inject({
      method: 'GET',
      url: `/api/role/${adminRole.id}`,
      headers: { cookie },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().name).toBe('Admin')
  })

  it('returns null for a non-existent id', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/role/999999',
      headers: { cookie },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toBeNull()
  })
})

// ── POST /api/role ────────────────────────────────────────────────────────────

describe('POST /api/role', () => {
  it('creates a new role', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/role',
      headers: { cookie },
      payload: { name: 'Editor' },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.id).toBeDefined()
    expect(body.name).toBe('Editor')
  })
})

// ── PUT /api/role/:id ─────────────────────────────────────────────────────────

describe('PUT /api/role/:id', () => {
  it('updates an existing role', async () => {
    // Create a role to update
    const createRes = await ctx.app.inject({
      method: 'POST',
      url: '/api/role',
      headers: { cookie },
      payload: { name: 'Temp Role' },
    })
    const { id } = createRes.json()

    const res = await ctx.app.inject({
      method: 'PUT',
      url: `/api/role/${id}`,
      headers: { cookie },
      payload: { name: 'Updated Role' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().name).toBe('Updated Role')
  })

  it('returns null when updating a non-existent role', async () => {
    const res = await ctx.app.inject({
      method: 'PUT',
      url: '/api/role/999999',
      headers: { cookie },
      payload: { name: 'Ghost' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toBeNull()
  })
})

// ── DELETE /api/role/:id ──────────────────────────────────────────────────────

describe('DELETE /api/role/:id', () => {
  it('deletes an existing role and returns success: true', async () => {
    const createRes = await ctx.app.inject({
      method: 'POST',
      url: '/api/role',
      headers: { cookie },
      payload: { name: 'To Be Deleted' },
    })
    const { id } = createRes.json()

    const res = await ctx.app.inject({
      method: 'DELETE',
      url: `/api/role/${id}`,
      headers: { cookie },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ success: true })
  })

  it('returns success: false for a non-existent role', async () => {
    const res = await ctx.app.inject({
      method: 'DELETE',
      url: '/api/role/999999',
      headers: { cookie },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ success: false })
  })
})
