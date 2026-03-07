import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp, teardown } from './setup.js'
import { AdminResource } from '../AdminResource.js'

// ── resources option ──────────────────────────────────────────────────────────
// Verifies that user-provided resource configs are merged into the registry
// and surfaced via /api/admin-config.

let ctx: Awaited<ReturnType<typeof buildApp>>

class RoleResource extends AdminResource {
  label = 'Team Roles'
  sidebar = false
  operations = ['list', 'show'] as any
}

beforeAll(async () => {
  ctx = await buildApp({
    resources: {
      role: new RoleResource(),
    },
  })
})

afterAll(async () => {
  await teardown(ctx)
})

describe('plugin resources option', () => {
  it('applies EntityConfig from a plain object', async () => {
    const app2 = await buildApp({
      resources: { role: { label: 'Roles Plain', sidebar: false } },
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

  it('applies config from an AdminResource subclass via toConfig()', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/admin-config',
    })
    expect(res.statusCode).toBe(200)
    const entity = res.json().entities['role']
    expect(entity.label).toBe('Team Roles')
    expect(entity.sidebar).toBe(false)
    expect(entity.operations).toEqual(['list', 'show'])
  })

  it('leaves other entities unaffected by the resources override', async () => {
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
