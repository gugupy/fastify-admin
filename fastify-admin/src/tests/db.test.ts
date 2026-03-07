import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── initORM ───────────────────────────────────────────────────────────────────
// We reset modules before each test so the singleton cache is cleared and
// @mikro-orm/postgresql can be mocked fresh per test.

describe('initORM', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('calls MikroORM.init with the provided options', async () => {
    const mockInit = vi.fn().mockResolvedValue({
      em: { fork: vi.fn().mockReturnValue({}) },
    })
    vi.doMock('@mikro-orm/postgresql', () => ({ MikroORM: { init: mockInit } }))

    const { initORM } = await import('../db.js')
    const options = { dbName: 'mydb', host: 'localhost' } as any
    await initORM(options)

    expect(mockInit).toHaveBeenCalledWith(options)
  })

  it('returns an object containing orm and em', async () => {
    const mockEm = { id: 'em' }
    const mockOrm = { em: { fork: vi.fn().mockReturnValue(mockEm) } }
    vi.doMock('@mikro-orm/postgresql', () => ({
      MikroORM: { init: vi.fn().mockResolvedValue(mockOrm) },
    }))

    const { initORM } = await import('../db.js')
    const result = await initORM({} as any)

    expect(result.orm).toBe(mockOrm)
    expect(result.em).toBe(mockEm)
  })

  it('caches the result — MikroORM.init is called only once across multiple calls', async () => {
    const mockInit = vi.fn().mockResolvedValue({
      em: { fork: vi.fn().mockReturnValue({}) },
    })
    vi.doMock('@mikro-orm/postgresql', () => ({ MikroORM: { init: mockInit } }))

    const { initORM } = await import('../db.js')
    const first = await initORM({} as any)
    const second = await initORM({} as any)

    expect(mockInit).toHaveBeenCalledTimes(1)
    expect(first).toBe(second)
  })

  it('ignores options on the second call and returns the cached instance', async () => {
    const mockInit = vi.fn().mockResolvedValue({
      em: { fork: vi.fn().mockReturnValue({}) },
    })
    vi.doMock('@mikro-orm/postgresql', () => ({ MikroORM: { init: mockInit } }))

    const { initORM } = await import('../db.js')
    await initORM({ dbName: 'first' } as any)
    await initORM({ dbName: 'second' } as any)

    expect(mockInit).toHaveBeenCalledWith({ dbName: 'first' })
    expect(mockInit).toHaveBeenCalledTimes(1)
  })
})
