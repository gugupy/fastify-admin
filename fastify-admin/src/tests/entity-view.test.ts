import { describe, it, expect } from 'vitest'
import { EntityView } from '../EntityView.js'
import { EntityRegistry } from '../registry.js'

// ── Default values ────────────────────────────────────────────────────────────

describe('EntityView defaults', () => {
  it('has sidebar enabled by default', () => {
    expect(new EntityView().sidebar).toBe(true)
  })

  it('has empty arrays for all view properties', () => {
    const r = new EntityView()
    expect(r.listColumns).toEqual([])
    expect(r.showFields).toEqual([])
    expect(r.editFields).toEqual([])
    expect(r.addFields).toEqual([])
    expect(r.rowActions).toEqual([])
    expect(r.relatedViews).toEqual([])
  })

  it('returns empty permissions by default', () => {
    expect(new EntityView().permissions).toEqual({})
  })

  it('has default pageSize of 20', () => {
    expect(new EntityView().pageSize).toBe(20)
  })

  it('has no label or icon by default', () => {
    const r = new EntityView()
    expect(r.label).toBeUndefined()
    expect(r.icon).toBeUndefined()
  })
})

// ── Computed config getters ───────────────────────────────────────────────────

describe('EntityView computed getters', () => {
  it('listConfig returns {} when listColumns is empty', () => {
    expect(new EntityView().listConfig).toEqual({})
  })

  it('listConfig returns { columns } when listColumns has values', () => {
    class R extends EntityView {
      listColumns = ['id', 'name']
    }
    expect(new R().listConfig).toEqual({ columns: ['id', 'name'] })
  })

  it('listConfig includes pageSize when not default', () => {
    class R extends EntityView {
      pageSize = 50
    }
    expect(new R().listConfig).toEqual({ pageSize: 50 })
  })

  it('listConfig omits pageSize when it equals default (20)', () => {
    class R extends EntityView {
      pageSize = 20
    }
    expect(new R().listConfig).toEqual({})
  })

  it('showConfig returns {} when showFields is empty', () => {
    expect(new EntityView().showConfig).toEqual({})
  })

  it('showConfig returns { fields } when showFields has values', () => {
    class R extends EntityView {
      showFields = ['id', 'name', 'email']
    }
    expect(new R().showConfig).toEqual({ fields: ['id', 'name', 'email'] })
  })

  it('showConfig includes relatedViews when set', () => {
    class R extends EntityView {
      relatedViews = ['orders', 'reviews']
    }
    expect(new R().showConfig).toEqual({ relatedViews: ['orders', 'reviews'] })
  })

  it('editConfig returns {} when editFields is empty', () => {
    expect(new EntityView().editConfig).toEqual({})
  })

  it('editConfig returns { fields } when editFields has values', () => {
    class R extends EntityView {
      editFields = ['name', 'price']
    }
    expect(new R().editConfig).toEqual({ fields: ['name', 'price'] })
  })

  it('addConfig returns {} when addFields is empty', () => {
    expect(new EntityView().addConfig).toEqual({})
  })

  it('addConfig returns { fields } when addFields has values', () => {
    class R extends EntityView {
      addFields = ['name', 'price', 'description']
    }
    expect(new R().addConfig).toEqual({
      fields: ['name', 'price', 'description'],
    })
  })
})

// ── toConfig() ────────────────────────────────────────────────────────────────

describe('EntityView.toConfig()', () => {
  it('returns the correct shape with default values', () => {
    expect(new EntityView().toConfig()).toMatchObject({
      sidebar: true,
      permissions: {},
      list: {},
      show: {},
      edit: {},
      add: {},
      actions: [],
    })
  })

  it('includes label and icon when set on the instance', () => {
    const r = new EntityView()
    r.label = 'Products'
    r.icon = 'shopping-bag'
    const config = r.toConfig()
    expect(config.label).toBe('Products')
    expect(config.icon).toBe('shopping-bag')
  })

  it('reflects sidebar = false from subclass', () => {
    class HiddenView extends EntityView {
      sidebar = false
    }
    expect(new HiddenView().toConfig().sidebar).toBe(false)
  })

  it('reflects disabled operations via permissions from subclass', () => {
    class ReadOnlyView extends EntityView {
      permissions = {
        create: false as const,
        edit: false as const,
        delete: false as const,
      }
    }
    expect(new ReadOnlyView().toConfig().permissions).toMatchObject({
      create: false,
      edit: false,
      delete: false,
    })
  })

  it('includes custom permissions from subclass', () => {
    class PermView extends EntityView {
      permissions = { list: 'custom.list', show: 'custom.show' } as any
    }
    expect(new PermView().toConfig().permissions).toEqual({
      list: 'custom.list',
      show: 'custom.show',
    })
  })

  it('includes rowActions from subclass', () => {
    class ActionView extends EntityView {
      rowActions = [{ label: 'Approve', action: 'approve' }] as any
    }
    expect(new ActionView().toConfig().actions).toEqual([
      { label: 'Approve', action: 'approve' },
    ])
  })

  it('includes all overridden view configs from a full subclass', () => {
    class ProductView extends EntityView {
      label = 'Products'
      sidebar = true
      listColumns = ['id', 'name', 'price']
      showFields = ['id', 'name', 'price', 'description']
      editFields = ['name', 'price']
      addFields = ['name', 'price', 'description']
      permissions = { delete: false as const }
    }
    const config = new ProductView().toConfig()
    expect(config.label).toBe('Products')
    expect(config.permissions).toMatchObject({ delete: false })
    expect(config.list).toEqual({ columns: ['id', 'name', 'price'] })
    expect(config.show).toEqual({
      fields: ['id', 'name', 'price', 'description'],
    })
    expect(config.edit).toEqual({ fields: ['name', 'price'] })
    expect(config.add).toEqual({ fields: ['name', 'price', 'description'] })
  })
})

// ── EntityRegistry ────────────────────────────────────────────────────────────

describe('EntityRegistry.get()', () => {
  it('returns the entity by name after autoRegister', () => {
    const registry = new EntityRegistry()
    // Simulate what autoRegister does — push a raw entity entry
    ;(registry as any).entities.push({
      name: 'product',
      entity: class {},
      config: {},
      fields: [],
    })

    expect(registry.get('product')).toMatchObject({ name: 'product' })
  })

  it('returns undefined for an unknown name', () => {
    const registry = new EntityRegistry()
    expect(registry.get('nonexistent')).toBeUndefined()
  })
})
