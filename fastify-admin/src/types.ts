import type { EntityClass } from '@mikro-orm/core'
import type { MikroORM } from '@mikro-orm/core'
import type { FastifyPluginOptions } from 'fastify'
import type { EntityView } from './EntityView.js'
import type { ViewRegistry } from './ViewRegistry.js'

export interface EntityPermissions {
  /** Permission string, or `false` to disable the operation entirely. */
  list?: string | false
  show?: string | false
  create?: string | false
  edit?: string | false
  delete?: string | false
}

export interface RowAction {
  label: string
  href: string
}

export interface ListConfig {
  columns?: string[]
  /** Number of rows per page. Default: 20. */
  pageSize?: number
}

export interface ShowConfig {
  fields?: string[]
  /** Related entity names to render as tabs (auto-detected from array fields if omitted). */
  relatedViews?: string[]
}

export interface EditConfig {
  fields?: string[]
}

export interface AddConfig {
  fields?: string[]
}

/** Serialisable entity config sent to the frontend via /api/admin-config */
export interface EntityConfig {
  label?: string
  /** Icon name string (e.g. a HugeIcons key). No React components here. */
  icon?: string
  sidebar?: boolean
  permissions?: EntityPermissions
  list?: ListConfig
  show?: ShowConfig
  edit?: EditConfig
  add?: AddConfig
  actions?: RowAction[]
}

/**
 * A menu item registered via plugin options and served via /api/admin-config.
 * Only registered items appear in the sidebar — nothing is auto-detected.
 */
export interface MenuItem {
  name: string
  label?: string
  /** String icon key resolved client-side via iconRegistry. */
  icon?: string
  /** Name of a parent item to nest this item under. */
  parent?: string
  /** Entity model name this item links to (routes to /$entity/list). */
  entity?: string
}

/** Full admin config response shape (from /api/admin-config) */
export interface AdminConfig {
  name: string
  signup: boolean
  requireEmailVerification: boolean
  mfaEnabled: boolean
  securityEntities: string[]
  oauth: {
    google: boolean
    github: boolean
    microsoft: boolean
  }
  entities: Record<string, EntityConfig>
  /** Registered menu items. When present, the sidebar renders only these items. */
  menu: MenuItem[]
}

/** Internal — pairs the config with the actual MikroORM entity class. */
export interface InternalEntity<T extends object = object> {
  name: string
  entity: EntityClass<T>
  config: EntityConfig
  fields: Array<{ name: string; type: string }>
  relations: string[]
}

/** A view entry: either a plain config object or an EntityView class instance. */
export type ViewConfig = EntityConfig | EntityView

export interface FastifyAdminOptions extends FastifyPluginOptions {
  /** Your MikroORM instance (already initialised). */
  orm: MikroORM
  /** Display name for the admin panel. Default: 'Admin'. */
  name?: string
  /** Allow self-registration. Default: false. Can be set via ADMIN_SIGNUP_ENABLED env var. */
  signup?: boolean
  /**
   * Require email OTP verification on signup.
   * Defaults to true when SMTP_HOST env var is set, false otherwise.
   * Set explicitly to override.
   */
  requireEmailVerification?: boolean
  /**
   * Whether email sending is available.
   * When false, MFA and email verification are disabled regardless of other settings.
   * Default: false.
   */
  mfaEnabled?: boolean
  /** Entity views — either a plain object or a ViewRegistry instance. */
  views?: Record<string, ViewConfig> | ViewRegistry
  /**
   * Entity names to treat as "security" entities:
   * hidden from the sidebar, inaccessible via the model routes.
   * Defaults to ['user', 'role', 'permission'].
   */
  securityEntities?: string[]
  /** URL where the OAuth providers will redirect back to. e.g. http://localhost:3001 */
  appBaseUrl?: string
  /**
   * Sidebar menu items. When provided, only these items appear in the sidebar.
   * Each item can link to an entity list page via the `entity` field.
   */
  menu?: MenuItem[]
  /**
   * Automatically append a "Security" group to the menu containing all
   * securityEntities (user, role, permission by default).
   * Default: false.
   */
  loadSecurity?: boolean
}
