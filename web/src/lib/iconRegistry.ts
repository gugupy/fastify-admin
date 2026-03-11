import type { ComponentType } from 'react'
import {
  Database,
  Shield,
  Sun,
  Moon,
  Monitor,
  Eye,
  Pencil,
  Trash2,
  ArrowLeft,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * A library-agnostic icon component. Accepts optional `size` and `className`.
 * Compatible with Lucide React, Heroicons, Phosphor, Radix Icons, and any other library.
 *
 * @example
 * // Lucide React
 * icon: Trash2
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

// ── Default icon implementations ──────────────────────────────────────────────

const defaults: AdminIcons = {
  entity: Database,
  security: Shield,
  sun: Sun,
  moon: Moon,
  system: Monitor,
  view: Eye,
  edit: Pencil,
  delete: Trash2,
  arrowLeft: ArrowLeft,
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
   * import { User, Package } from 'lucide-react'
   *
   * iconRegistry.registerEntityIcons({
   *   User: User,
   *   Package: Package,
   * })
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
