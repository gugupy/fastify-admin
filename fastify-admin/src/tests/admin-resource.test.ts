import { describe, it, expect } from 'vitest'
import { AdminResource } from '../AdminResource.js'
import { EntityRegistry } from '../registry.js'
import { ALL_OPERATIONS } from '../types.js'

// ── Default values ────────────────────────────────────────────────────────────

describe('AdminResource defaults', () => {
  it('has sidebar enabled by default', () => {
    expect(new AdminResource().sidebar).toBe(true)
  })

  it('enables all operations by default', () => {
    expect(new AdminResource().operations).toEqual([...ALL_OPERATIONS])
  })

  it('returns empty arrays from all view methods', () => {
    const r = new AdminResource()
    expect(r.listColumns()).toEqual([])
    expect(r.showFields()).toEqual([])
    expect(r.editFields()).toEqual([])
    expect(r.addFields()).toEqual([])
    expect(r.rowActions()).toEqual([])
  })

  it('returns empty permissions by default', () => {
    expect(new AdminResource().permissions()).toEqual({})
  })

  it('has no label or icon by default', () => {
    const r = new AdminResource()
    expect(r.label).toBeUndefined()
    expect(r.icon).toBeUndefined()
  })
})

// ── Computed config getters ───────────────────────────────────────────────────

describe('AdminResource computed getters', () => {
  it('listConfig returns {} when listColumns() is empty', () => {
    expect(new AdminResource().listConfig).toEqual({})
  })

  it('listConfig returns { columns } when listColumns() has values', () => {
    class R extends AdminResource {
      listColumns() {
        return ['id', 'name']
      }
    }
    expect(new R().listConfig).toEqual({ columns: ['id', 'name'] })
  })

  it('showConfig returns {} when showFields() is empty', () => {
    expect(new AdminResource().showConfig).toEqual({})
  })

  it('showConfig returns { fields } when showFields() has values', () => {
    class R extends AdminResource {
      showFields() {
        return ['id', 'name', 'email']
      }
    }
    expect(new R().showConfig).toEqual({ fields: ['id', 'name', 'email'] })
  })

  it('editConfig returns {} when editFields() is empty', () => {
    expect(new AdminResource().editConfig).toEqual({})
  })

  it('editConfig returns { fields } when editFields() has values', () => {
    class R extends AdminResource {
      editFields() {
        return ['name', 'price']
      }
    }
    expect(new R().editConfig).toEqual({ fields: ['name', 'price'] })
  })

  it('addConfig returns {} when addFields() is empty', () => {
    expect(new AdminResource().addConfig).toEqual({})
  })

  it('addConfig returns { fields } when addFields() has values', () => {
    class R extends AdminResource {
      addFields() {
        return ['name', 'price', 'description']
      }
    }
    expect(new R().addConfig).toEqual({
      fields: ['name', 'price', 'description'],
    })
  })
})

// ── toConfig() ────────────────────────────────────────────────────────────────

describe('AdminResource.toConfig()', () => {
  it('returns the correct shape with default values', () => {
    expect(new AdminResource().toConfig()).toMatchObject({
      sidebar: true,
      operations: [...ALL_OPERATIONS],
      permissions: {},
      list: {},
      show: {},
      edit: {},
      add: {},
      actions: [],
    })
  })

  it('includes label and icon when set on the instance', () => {
    const r = new AdminResource()
    r.label = 'Products'
    r.icon = 'shopping-bag'
    const config = r.toConfig()
    expect(config.label).toBe('Products')
    expect(config.icon).toBe('shopping-bag')
  })

  it('reflects sidebar = false from subclass', () => {
    class HiddenResource extends AdminResource {
      sidebar = false
    }
    expect(new HiddenResource().toConfig().sidebar).toBe(false)
  })

  it('reflects restricted operations from subclass', () => {
    class ReadOnlyResource extends AdminResource {
      operations = ['list', 'show'] as any
    }
    expect(new ReadOnlyResource().toConfig().operations).toEqual([
      'list',
      'show',
    ])
  })

  it('includes custom permissions from subclass', () => {
    class PermResource extends AdminResource {
      permissions() {
        return { list: 'custom.list', show: 'custom.show' } as any
      }
    }
    expect(new PermResource().toConfig().permissions).toEqual({
      list: 'custom.list',
      show: 'custom.show',
    })
  })

  it('includes rowActions from subclass', () => {
    class ActionResource extends AdminResource {
      rowActions() {
        return [{ label: 'Approve', action: 'approve' }] as any
      }
    }
    expect(new ActionResource().toConfig().actions).toEqual([
      { label: 'Approve', action: 'approve' },
    ])
  })

  it('includes all overridden view configs from a full subclass', () => {
    class ProductResource extends AdminResource {
      label = 'Products'
      sidebar = true
      operations = ['list', 'show', 'create'] as any
      listColumns() {
        return ['id', 'name', 'price']
      }
      showFields() {
        return ['id', 'name', 'price', 'description']
      }
      editFields() {
        return ['name', 'price']
      }
      addFields() {
        return ['name', 'price', 'description']
      }
    }
    const config = new ProductResource().toConfig()
    expect(config.label).toBe('Products')
    expect(config.operations).toEqual(['list', 'show', 'create'])
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
