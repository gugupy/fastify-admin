import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { buildApp, teardown } from './setup.js'
import { generateUsername } from '../lib/auth-utils.js'
import { User } from '../index.js'

vi.mock('../lib/mailer.js', () => ({ sendMfaCode: vi.fn() }))

let ctx: Awaited<ReturnType<typeof buildApp>>

beforeAll(async () => {
  ctx = await buildApp()
})

afterAll(async () => {
  await teardown(ctx)
})

describe('generateUsername', () => {
  it('uses the part before @ as the base', async () => {
    const em = ctx.orm.em.fork()
    const result = await generateUsername(em, 'john@example.com')
    expect(result).toBe('john')
  })

  it('lowercases the username', async () => {
    const em = ctx.orm.em.fork()
    const result = await generateUsername(em, 'JohnDoe@example.com')
    expect(result).toBe('johndoe')
  })

  it('strips special characters from the email local part', async () => {
    const em = ctx.orm.em.fork()
    const result = await generateUsername(em, 'john.doe+tag@example.com')
    expect(result).toBe('johndoetag')
  })

  it('falls back to "user" when local part has no valid characters', async () => {
    const em = ctx.orm.em.fork()
    const result = await generateUsername(em, '+++@example.com')
    expect(result).toBe('user')
  })

  it('appends a number when the base username is already taken', async () => {
    const em = ctx.orm.em.fork()

    // Seed a user with username 'taken'
    em.create(User, {
      username: 'taken',
      fullName: 'Taken User',
      email: 'taken@example.com',
      password: 'hashed',
    })
    await em.flush()

    const result = await generateUsername(em, 'taken@example.com')
    expect(result).toBe('taken1')
  })

  it('increments the number until a free username is found', async () => {
    const em = ctx.orm.em.fork()

    // Seed 'free', 'free1', 'free2' — next should be 'free3'
    for (const [username, email] of [
      ['free', 'free@example.com'],
      ['free1', 'free1@example.com'],
      ['free2', 'free2@example.com'],
    ]) {
      em.create(User, { username, fullName: 'User', email, password: 'hashed' })
    }
    await em.flush()

    const result = await generateUsername(em, 'free@example.com')
    expect(result).toBe('free3')
  })
})
