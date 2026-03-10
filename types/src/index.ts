/**
 * Shared types between the API and web packages.
 * These represent the HTTP contract — what the API sends and the web receives.
 */

// ── /api/entities ─────────────────────────────────────────────────────────────

/** A single entity field as returned by GET /api/entities */
export type Field = {
  name: string
  type: string
}

/** An entity's metadata as returned by GET /api/entities */
export type EntityMeta = {
  name: string
  fields: Field[]
  relations: string[]
}

/** A single record count entry as returned by GET /api/dashboard */
export type EntityCount = {
  name: string
  count: number
}

// ── /api/admin-config ─────────────────────────────────────────────────────────

export type RowAction = {
  label: string
  href: string
}

/**
 * Per-operation permission overrides.
 * A permission string gates access via RBAC; `false` disables the operation entirely.
 */
export type EntityPermissions = {
  list?: string | false
  show?: string | false
  create?: string | false
  edit?: string | false
  delete?: string | false
}

export type ListConfig = {
  columns?: string[]
  /** Number of rows per page. Default: 20. */
  pageSize?: number
}

export type ShowConfig = {
  fields?: string[]
  /** Related entity names to render as tabs (auto-detected from array fields if omitted). */
  relatedViews?: string[]
}

export type EditConfig = {
  fields?: string[]
}

export type AddConfig = {
  fields?: string[]
}

/** Serialisable entity config as returned by /api/admin-config */
export type EntityConfig = {
  label?: string
  /** Icon name string (e.g. a HugeIcons key). */
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
 * A menu item registered server-side and served via /api/admin-config.
 * Only registered items appear in the sidebar — nothing is auto-detected.
 *
 * - name   — unique key; used as the item identifier and for parent references
 * - label  — display text shown in the sidebar
 * - icon   — string icon key resolved client-side via iconRegistry
 * - parent — name of a parent item to nest this item under
 * - entity — entity model name this item links to (routes to /$entity/list)
 */
export type MenuItem = {
  name: string
  label?: string
  icon?: string
  parent?: string
  entity?: string
}

/** Full shape of the /api/admin-config response */
export type AdminConfig = {
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
