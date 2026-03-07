import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { buildApp, teardown } from './setup.js'
import { createHelpers } from './helpers.js'
import { User } from '../index.js'

vi.mock('../lib/mailer.js', () => ({ sendMfaCode: vi.fn() }))

import { sendMfaCode } from '../lib/mailer.js'
const mockSendMfaCode = vi.mocked(sendMfaCode)

let ctx: Awaited<ReturnType<typeof buildApp>>
let helpers: ReturnType<typeof createHelpers>

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeAll(async () => {
  ctx = await buildApp({ requireEmailVerification: true })
  helpers = createHelpers(() => ctx)
})

afterAll(async () => {
  if (ctx) await teardown(ctx)
})

// ── Email verification ────────────────────────────────────────────────────────

describe('POST /api/auth/signup (requireEmailVerification: true)', () => {
  it('returns 409 when email is already in use', async () => {
    await helpers.signup('dupuser', 'dup@example.com')
    const res = await helpers.signup('dupuser2', 'dup@example.com')
    expect(res.statusCode).toBe(409)
    expect(res.json().message).toBe('Email already in use.')
  })

  it('returns requiresVerification: true and does not set a cookie', async () => {
    mockSendMfaCode.mockClear()
    const res = await helpers.signup('verifyuser', 'verify@example.com')
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ ok: true, requiresVerification: true })
    expect(res.headers['set-cookie']).toBeUndefined()
    expect(mockSendMfaCode).toHaveBeenCalledOnce()
  })

  it('blocks login before email is verified', async () => {
    mockSendMfaCode.mockClear()
    await helpers.signup('unverified', 'unverified@example.com')

    const res = await helpers.login('unverified@example.com')
    expect(res.statusCode).toBe(403)
    expect(res.json().message).toBe('Email not verified.')
  })
})

describe('POST /api/auth/signup/verify', () => {
  it('sets a JWT cookie when the correct code is submitted', async () => {
    mockSendMfaCode.mockClear()
    await helpers.signup('verifyok', 'verifyok@example.com')
    const code: string = mockSendMfaCode.mock.calls[0][1]

    const res = await helpers.verify('verifyok@example.com', code)
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ ok: true })
    expect(res.headers['set-cookie']).toMatch(/token=/)
  })

  it('returns 400 for an incorrect code', async () => {
    mockSendMfaCode.mockClear()
    await helpers.signup('verifybad', 'verifybad@example.com')

    const res = await helpers.verify('verifybad@example.com', '000000')
    expect(res.statusCode).toBe(400)
    expect(res.json().message).toBe('Invalid code.')
  })

  it('returns 400 for an unknown email', async () => {
    const res = await helpers.verify('nobody@example.com', '123456')
    expect(res.statusCode).toBe(400)
    expect(res.json().message).toBe('Invalid or expired code.')
  })

  it('returns 400 when the verification code has expired', async () => {
    mockSendMfaCode.mockClear()
    await helpers.signup('expireduser', 'expired@example.com')

    // Manually expire the code in the DB
    const em = ctx.orm.em.fork()
    const user = await em.findOneOrFail(User, { email: 'expired@example.com' })
    user.mfaCodeExpiresAt = new Date(Date.now() - 1000) // 1 second in the past
    await em.flush()

    const code: string = mockSendMfaCode.mock.calls[0][1]
    const res = await helpers.verify('expired@example.com', code)
    expect(res.statusCode).toBe(400)
    expect(res.json().message).toBe('Code expired.')
  })
})
