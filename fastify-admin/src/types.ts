import type { EntityClass } from '@mikro-orm/core'
import type { MikroORM } from '@mikro-orm/core'
import type { FastifyPluginOptions } from 'fastify'
import type { AdminResource } from './AdminResource.js'

export type Operation = 'list' | 'show' | 'create' | 'edit' | 'delete'

export const ALL_OPERATIONS: Operation[] = [
  'list',
  'show',
  'create',
  'edit',
  'delete',
]

export interface EntityPermissions {
  list?: string
  show?: string
  create?: string
  edit?: string
  delete?: string
}

export interface RowAction {
  label: string
  href: string
}

export interface ListConfig {
  columns?: string[]
}

export interface ShowConfig {
  fields?: string[]
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
  operations?: Operation[]
  permissions?: EntityPermissions
  list?: ListConfig
  show?: ShowConfig
  edit?: EditConfig
  add?: AddConfig
  actions?: RowAction[]
}

/** Full admin config response shape (from /api/admin-config) */
export interface AdminConfig {
  name: string
  signup: boolean
  requireEmailVerification: boolean
  emailEnabled: boolean
  securityEntities: string[]
  oauth: {
    google: boolean
    github: boolean
    microsoft: boolean
  }
  entities: Record<string, EntityConfig>
}

/** Internal — pairs the config with the actual MikroORM entity class. */
export interface InternalEntity<T extends object = object> {
  name: string
  entity: EntityClass<T>
  config: EntityConfig
  fields: Array<{ name: string; type: string }>
}

export interface OAuthProviderConfig {
  google?: boolean
  github?: boolean
  microsoft?: boolean
}

/** A resource entry: either a plain config object or an AdminResource class instance. */
export type ResourceConfig = EntityConfig | AdminResource

export interface FastifyAdminOptions extends FastifyPluginOptions {
  /** Your MikroORM instance (already initialised). */
  orm: MikroORM
  /** Display name for the admin panel. Default: 'Admin'. */
  name?: string
  /** Allow self-registration. Default: true. */
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
  emailEnabled?: boolean
  /** Resource configs keyed by entity collection name. */
  resources?: Record<string, ResourceConfig>
  /**
   * Entity names to treat as "security" entities:
   * hidden from the sidebar, inaccessible via the model routes.
   * Defaults to ['user', 'role', 'permission'].
   */
  securityEntities?: string[]
  /** URL where the OAuth providers will redirect back to. e.g. http://localhost:3001 */
  appBaseUrl?: string
}
