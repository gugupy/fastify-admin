import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { buildApp, teardown } from './setup.js'
import { createHelpers } from './helpers.js'
import { User, Role, Permission } from '../index.js'
import { loadPermissions } from '../lib/auth-utils.js'
import { WEB_PERMISSIONS } from '../seedRbac.js'
import { hashPassword } from '../lib/password.js'

vi.mock('../lib/mailer.js', () => ({ sendMfaCode: vi.fn() }))

let ctx: Awaited<ReturnType<typeof buildApp>>
let h: ReturnType<typeof createHelpers>
let allPermissions: string[]

const ACTIONS = ['list', 'show', 'create', 'edit', 'delete']

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeAll(async () => {
  ctx = await buildApp()
  h = createHelpers(() => ctx)

  // Derive expected permissions from ORM metadata (same logic as seedRbac)
  const entities = Object.values(ctx.orm.getMetadata().getAll())
    .filter((meta) => !meta.pivotTable)
    .map((meta) => meta.collection)
  allPermissions = [
    ...entities.flatMap((e) => ACTIONS.map((a) => `${e}.${a}`)),
    ...WEB_PERMISSIONS,
  ]

  // Create admin user and assign Admin role
  await h.signup('adminuser', 'admin@example.com')
  const em = ctx.orm.em.fork()
  const user = await em.findOneOrFail(User, { email: 'admin@example.com' })
  const adminRole = await em.findOneOrFail(
    Role,
    { name: 'Admin' },
    { populate: ['users'] },
  )
  adminRole.users.add(user)
  await em.flush()
})

afterAll(async () => {
  await teardown(ctx)
})

// ── loadPermissions (unit) ────────────────────────────────────────────────────

describe('loadPermissions', () => {
  it('returns [] for a non-existent user id', async () => {
    const em = ctx.orm.em.fork()
    const result = await loadPermissions(em, 999999)
    expect(result).toEqual([])
  })

  it('returns [] for a user with no roles', async () => {
    // Create directly via em to bypass the signup route (which assigns Viewer role)
    const em = ctx.orm.em.fork()
    const user = em.create(User, {
      fullName: 'No Roles',
      username: 'noroles',
      email: 'noroles@example.com',
      password: await hashPassword('password123'),
    })
    await em.persist(user).flush()
    const result = await loadPermissions(em, user.id)
    expect(result).toEqual([])
  })

  it('returns all permissions for a user with the Admin role', async () => {
    const em = ctx.orm.em.fork()
    const user = await em.findOneOrFail(User, { email: 'admin@example.com' })
    const result = await loadPermissions(em, user.id)
    expect(result.sort()).toEqual(allPermissions.sort())
  })

  it('deduplicates permissions when user has multiple roles with overlapping permissions', async () => {
    await h.signup('multirole', 'multirole@example.com')
    const em = ctx.orm.em.fork()
    const user = await em.findOneOrFail(User, {
      email: 'multirole@example.com',
    })

    // Create two roles with overlapping permissions
    const permA = em.create(Permission, { name: 'test.read' })
    const permB = em.create(Permission, { name: 'test.write' })
    await em.persist([permA, permB]).flush()

    const role1 = em.create(Role, { name: 'Role1' })
    const role2 = em.create(Role, { name: 'Role2' })
    await em.persist([role1, role2]).flush()

    await em.populate(role1, ['permissions'])
    await em.populate(role2, ['permissions'])
    role1.permissions.add(permA, permB)
    role2.permissions.add(permA) // overlap: permA in both roles

    await em.populate(user, ['roles'])
    user.roles.add(role1, role2)
    await em.flush()

    const result = await loadPermissions(em, user.id)
    // permA should appear only once despite being in both roles
    expect(result.filter((p) => p === 'test.read')).toHaveLength(1)
    expect(result).toContain('test.write')
  })
})

// ── loadPermissions via GET /api/auth/me (integration) ───────────────────────

describe('GET /api/auth/me permissions', () => {
  it('returns empty permissions for a user with no roles', async () => {
    // Create directly via em to bypass the signup route (which assigns Viewer role)
    const em = ctx.orm.em.fork()
    const user = em.create(User, {
      fullName: 'No Roles HTTP',
      username: 'noroleshttp',
      email: 'noroleshttp@example.com',
      password: await hashPassword('password123'),
    })
    await em.persist(user).flush()
    const loginRes = await h.login('noroleshttp@example.com')
    const cookie = h.cookieFrom(loginRes)

    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().permissions).toEqual([])
  })

  it('returns all permissions for an admin user', async () => {
    const loginRes = await h.login('admin@example.com')
    const cookie = h.cookieFrom(loginRes)

    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie },
    })
    expect(res.statusCode).toBe(200)
    const { permissions } = res.json()
    expect(permissions.sort()).toEqual(allPermissions.sort())
  })
})
