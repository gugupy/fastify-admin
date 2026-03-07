import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp, teardown } from './setup.js'
import { createAdminUser, resetUserPassword } from '../cli/index.js'
import { User } from '../index.js'
import { Role } from '../entities/role.entity.js'
import { verifyPassword } from '../lib/password.js'

let ctx: Awaited<ReturnType<typeof buildApp>>

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeAll(async () => {
  ctx = await buildApp()
})

afterAll(async () => {
  await teardown(ctx)
})

// ── createAdminUser ───────────────────────────────────────────────────────────

describe('createAdminUser', () => {
  it('creates a user with a hashed password', async () => {
    const em = ctx.orm.em.fork()
    const { user } = await createAdminUser(em, {
      fullName: 'CLI Admin',
      username: 'cliadmin',
      email: 'cliadmin@example.com',
      password: 'password123',
    })

    expect(user.id).toBeDefined()
    expect(user.email).toBe('cliadmin@example.com')
    expect(user.username).toBe('cliadmin')
    expect(user.fullName).toBe('CLI Admin')
    // password must be hashed, not plain text
    expect(user.password).not.toBe('password123')
    expect(await verifyPassword('password123', user.password!)).toBe(true)
  })

  it('assigns the Admin role to the created user', async () => {
    const em = ctx.orm.em.fork()
    const { adminRole } = await createAdminUser(em, {
      fullName: 'CLI Admin 2',
      username: 'cliadmin2',
      email: 'cliadmin2@example.com',
      password: 'password123',
    })

    expect(adminRole).not.toBeNull()

    // Verify via a fresh em that the user is in the Admin role
    const freshEm = ctx.orm.em.fork()
    const role = await freshEm.findOneOrFail(
      Role,
      { name: 'Admin' },
      { populate: ['users'] },
    )
    expect(
      role.users.getItems().some((u) => u.email === 'cliadmin2@example.com'),
    ).toBe(true)
  })

  it('returns adminRole as null when Admin role does not exist', async () => {
    // Temporarily use an em that sees no Admin role by deleting it first
    const setupEm = ctx.orm.em.fork()
    const adminRole = await setupEm.findOne(Role, { name: 'Admin' })
    if (adminRole) {
      await setupEm.removeAndFlush(adminRole)
    }

    const em = ctx.orm.em.fork()
    const { user, adminRole: result } = await createAdminUser(em, {
      fullName: 'No Role Admin',
      username: 'norolecli',
      email: 'norolecli@example.com',
      password: 'password123',
    })

    expect(result).toBeNull()
    expect(user.id).toBeDefined()

    // Restore the Admin role so other tests are unaffected
    const restoreEm = ctx.orm.em.fork()
    restoreEm.create(Role, { name: 'Admin' })
    await restoreEm.flush()
  })
})

// ── resetUserPassword ─────────────────────────────────────────────────────────

describe('resetUserPassword', () => {
  beforeAll(async () => {
    // Seed a user to reset
    const em = ctx.orm.em.fork()
    await createAdminUser(em, {
      fullName: 'Reset User',
      username: 'resetuser',
      email: 'resetuser@example.com',
      password: 'oldpassword1',
    })
  })

  it('updates the password for an existing user', async () => {
    const em = ctx.orm.em.fork()
    const user = await resetUserPassword(
      em,
      'resetuser@example.com',
      'newpassword99',
    )

    expect(user.email).toBe('resetuser@example.com')
    expect(await verifyPassword('newpassword99', user.password!)).toBe(true)
    expect(await verifyPassword('oldpassword1', user.password!)).toBe(false)
  })

  it('persists the new password to the database', async () => {
    const em = ctx.orm.em.fork()
    await resetUserPassword(em, 'resetuser@example.com', 'persistedpass')

    const freshEm = ctx.orm.em.fork()
    const user = await freshEm.findOneOrFail(User, {
      email: 'resetuser@example.com',
    })
    expect(await verifyPassword('persistedpass', user.password!)).toBe(true)
  })

  it('throws when no user is found for the given email', async () => {
    const em = ctx.orm.em.fork()
    await expect(
      resetUserPassword(em, 'nobody@example.com', 'password123'),
    ).rejects.toThrow('No user found with email "nobody@example.com".')
  })
})
