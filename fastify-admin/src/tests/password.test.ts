import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '../lib/password.js'

describe('hashPassword', () => {
  it('returns a salt:hash string', async () => {
    const result = await hashPassword('secret')
    expect(result).toMatch(/^[a-f0-9]+:[a-f0-9]+$/)
  })

  it('produces different hashes for the same input', async () => {
    const a = await hashPassword('secret')
    const b = await hashPassword('secret')
    expect(a).not.toBe(b)
  })
})

describe('verifyPassword', () => {
  it('returns true for a correct password', async () => {
    const hash = await hashPassword('correct')
    expect(await verifyPassword('correct', hash)).toBe(true)
  })

  it('returns false for a wrong password', async () => {
    const hash = await hashPassword('correct')
    expect(await verifyPassword('wrong', hash)).toBe(false)
  })

  it('returns false for a malformed stored value', async () => {
    expect(await verifyPassword('anything', 'notahash')).toBe(false)
  })
})
