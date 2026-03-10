import type { ComponentType } from 'react'
import { createElement } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  DatabaseLightningIcon,
  SecurityIcon,
  Sun01Icon,
  Moon01Icon,
  ComputerIcon,
  View,
  Edit,
  Delete,
  ArrowLeft01Icon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * A library-agnostic icon component. Accepts optional `size` and `className`.
 * Compatible with Lucide React, Heroicons, Phosphor, Radix Icons, and any other library.
 *
 * @example
 * // Lucide React
 * icon: Trash2
 *
 * // HugeIcons (use asIcon helper)
 * icon: asIcon(DeleteIcon)
 *
 * // Inline SVG
 * icon: ({ size = 16, className }) => <svg width={size} height={size} className={className}>...</svg>
 */
export type AdminIconComponent = ComponentType<{
  size?: number
  className?: string
}>

/** Named icon slots used throughout the admin UI. */
export type AdminIconKey =
  | 'entity' // Default entity icon in sidebar
  | 'security' // Security section icon in sidebar
  | 'sun' // Theme toggle: light mode
  | 'moon' // Theme toggle: dark mode
  | 'system' // Theme toggle: system mode
  | 'view' // View/Show action in list
  | 'edit' // Edit action in list
  | 'delete' // Delete action in list
  | 'arrowLeft' // Back button in show/edit pages

export type AdminIcons = Record<AdminIconKey, AdminIconComponent>

// ── HugeIcons adapter ─────────────────────────────────────────────────────────

/**
 * Wraps a HugeIcons SVG element into an `AdminIconComponent`.
 * Use this when setting entity icons or app icons from the HugeIcons library.
 *
 * @example
 * import { LayersIcon } from '@hugeicons/core-free-icons'
 * icon: asIcon(LayersIcon)
 */
export function asIcon(hugeIcon: IconSvgElement): AdminIconComponent {
  return function HugeIconWrapper({ size, className }) {
    return createElement(HugeiconsIcon, { icon: hugeIcon, size, className })
  }
}

// ── Default icon implementations ──────────────────────────────────────────────

const defaults: AdminIcons = {
  entity: asIcon(DatabaseLightningIcon),
  security: asIcon(SecurityIcon),
  sun: asIcon(Sun01Icon),
  moon: asIcon(Moon01Icon),
  system: asIcon(ComputerIcon),
  view: asIcon(View),
  edit: asIcon(Edit),
  delete: asIcon(Delete),
  arrowLeft: asIcon(ArrowLeft01Icon),
}

// ── Registry singleton ────────────────────────────────────────────────────────

const registry: AdminIcons = { ...defaults }

/**
 * Entity icon map: maps string icon names (as configured on the server)
 * to React components. Populated via `iconRegistry.registerEntityIcons()`.
 */
const entityIconMap: Record<string, AdminIconComponent> = {}

export const iconRegistry = {
  /** Get the icon component for a named UI slot. */
  get(key: AdminIconKey): AdminIconComponent {
    return registry[key]
  },

  /**
   * Override one or more named UI icon slots with custom components.
   * Call this before rendering (e.g. in main.tsx alongside FastifyAdmin.boot()).
   *
   * @example
   * import { Trash2, Pencil } from 'lucide-react'
   * iconRegistry.override({ delete: Trash2, edit: Pencil })
   */
  override(overrides: Partial<AdminIcons>): void {
    Object.assign(registry, overrides)
  },

  /**
   * Register entity icons by their string name (as returned by the server config).
   * These are looked up automatically by `FastifyAdmin.initFromApi()` — no need
   * to pass an `iconMap` parameter anymore.
   *
   * @example
   * import { User03Icon, Package01Icon } from '@hugeicons/core-free-icons'
   *
   * iconRegistry.registerEntityIcons({
   *   User03:   asIcon(User03Icon),
   *   Package01: asIcon(Package01Icon),
   * })
   *
   * // Or with any other icon library:
   * import { Users, Package } from 'lucide-react'
   * iconRegistry.registerEntityIcons({ User03: Users, Package01: Package })
   */
  registerEntityIcons(icons: Record<string, AdminIconComponent>): void {
    Object.assign(entityIconMap, icons)
  },

  /** Look up an entity icon by its server-side string name. Used internally by initFromApi. */
  getEntityIcon(name: string): AdminIconComponent | undefined {
    return entityIconMap[name]
  },

  /** Reset all icons back to their defaults. Mainly useful in tests. */
  reset(): void {
    Object.assign(registry, defaults)
    Object.keys(entityIconMap).forEach((k) => delete entityIconMap[k])
  },
}
