import type { AdminIconComponent } from './iconRegistry'
import type { MenuItem as MenuItemBase } from '@fastify-admin/types'

export type { MenuItemBase as MenuItemConfig }

/**
 * A resolved menu item — same as the server-side MenuItem but with the icon
 * already resolved from a string key to a React component.
 */
export type MenuItem = MenuItemBase & {
  iconComponent?: AdminIconComponent
}

const items: MenuItem[] = []

export const menuRegistry = {
  /**
   * Populate the registry from the /api/admin-config response.
   * Called by FastifyAdmin.initFromApi — no need to call this manually.
   */
  populate(menuItems: MenuItem[]) {
    items.length = 0
    items.push(...menuItems)
  },

  /** All registered top-level items (no parent). */
  getTopLevel(): MenuItem[] {
    return items.filter((i) => !i.parent)
  },

  /** All children of a given parent name. */
  getChildren(parentName: string): MenuItem[] {
    return items.filter((i) => i.parent === parentName)
  },

  /** All registered items. */
  getAll(): MenuItem[] {
    return [...items]
  },

  /** True if any items have been registered. */
  hasItems(): boolean {
    return items.length > 0
  },
}
