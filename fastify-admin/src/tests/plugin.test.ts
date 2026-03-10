import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp, teardown } from './setup.js'
import { EntityView } from '../EntityView.js'

// ── views option ──────────────────────────────────────────────────────────────
// Verifies that user-provided view configs are merged into the registry
// and surfaced via /api/admin-config.

let ctx: Awaited<ReturnType<typeof buildApp>>

class RoleView extends EntityView {
  label = 'Team Roles'
  sidebar = false
  permissions() {
    return {
      create: false as const,
      edit: false as const,
      delete: false as const,
    }
  }
}

beforeAll(async () => {
  ctx = await buildApp({
    views: {
      role: new RoleView(),
    },
  })
})

afterAll(async () => {
  await teardown(ctx)
})

describe('plugin views option', () => {
  it('applies EntityConfig from a plain object', async () => {
    const app2 = await buildApp({
      views: { role: { label: 'Roles Plain', sidebar: false } },
    })
    const res = await app2.app.inject({
      method: 'GET',
      url: '/api/admin-config',
    })
    const entity = res.json().entities['role']
    expect(entity.label).toBe('Roles Plain')
    expect(entity.sidebar).toBe(false)
    await teardown(app2)
  })

  it('applies config from an EntityView subclass via toConfig()', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/admin-config',
    })
    expect(res.statusCode).toBe(200)
    const entity = res.json().entities['role']
    expect(entity.label).toBe('Team Roles')
    expect(entity.sidebar).toBe(false)
    expect(entity.permissions).toMatchObject({
      create: false,
      edit: false,
      delete: false,
    })
  })

  it('leaves other entities unaffected by the views override', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/admin-config',
    })
    const entities = res.json().entities
    // 'user' and 'permission' should still be present with default config
    expect(entities['user']).toBeDefined()
    expect(entities['permission']).toBeDefined()
  })
})
