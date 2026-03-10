import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp, teardown } from './setup.js'
import { EntityView } from '../EntityView.js'
import type { MenuItem } from '../types.js'

// ── views option ──────────────────────────────────────────────────────────────
// Verifies that user-provided view configs are merged into the registry
// and surfaced via /api/admin-config.

let ctx: Awaited<ReturnType<typeof buildApp>>

class RoleView extends EntityView {
  label = 'Team Roles'
  sidebar = false
  permissions = {
    create: false as const,
    edit: false as const,
    delete: false as const,
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

// ── menu option ────────────────────────────────────────────────────────────────
// Verifies that registered menu items are surfaced via /api/admin-config.

describe('plugin menu option', () => {
  it('returns an empty menu array when no menu is registered', async () => {
    const app = await buildApp()
    const res = await app.app.inject({ method: 'GET', url: '/api/admin-config' })
    expect(res.json().menu).toEqual([])
    await teardown(app)
  })

  it('returns registered menu items in /api/admin-config', async () => {
    const menu: MenuItem[] = [
      { name: 'content', label: 'Content' },
      { name: 'posts', label: 'Posts', entity: 'post', parent: 'content' },
    ]
    const app = await buildApp({ menu })
    const res = await app.app.inject({ method: 'GET', url: '/api/admin-config' })
    expect(res.json().menu).toEqual(menu)
    await teardown(app)
  })

  it('loadSecurity prepends a Security group with all securityEntities', async () => {
    const app = await buildApp({ loadSecurity: true })
    const res = await app.app.inject({ method: 'GET', url: '/api/admin-config' })
    const menu: MenuItem[] = res.json().menu
    // Security group item comes first
    expect(menu[0]).toMatchObject({ name: 'security', label: 'Security', icon: 'security' })
    // Each default security entity appears as a child of 'security'
    const childNames = menu.filter((i) => i.parent === 'security').map((i) => i.name)
    expect(childNames).toEqual(expect.arrayContaining(['user', 'role', 'permission']))
    await teardown(app)
  })

  it('loadSecurity items appear before custom menu items', async () => {
    const menu: MenuItem[] = [{ name: 'content', label: 'Content' }]
    const app = await buildApp({ menu, loadSecurity: true })
    const res = await app.app.inject({ method: 'GET', url: '/api/admin-config' })
    const items: MenuItem[] = res.json().menu
    const secIdx = items.findIndex((i) => i.name === 'security')
    const contentIdx = items.findIndex((i) => i.name === 'content')
    expect(secIdx).toBeLessThan(contentIdx)
    await teardown(app)
  })
})
