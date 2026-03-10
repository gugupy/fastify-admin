import type { ComponentType } from 'react'
import type { Field, EntityMeta } from '../types/entity'
import type { AdminIconComponent } from './iconRegistry'
import type {
  EntityPermissions,
  ListConfig as BaseListConfig,
  ShowConfig as BaseShowConfig,
  EditConfig as BaseEditConfig,
  AddConfig as BaseAddConfig,
} from '@fastify-admin/types'

// Re-export the shared type so consumers can import from one place
export type { EntityPermissions } from '@fastify-admin/types'

// ── Shared prop shapes ────────────────────────────────────────────────────────

type ListViewProps = {
  model: string
  entity: EntityMeta
  records: Record<string, unknown>[]
}

type ShowViewProps = {
  model: string
  id: string
  entity: EntityMeta
  record: Record<string, unknown>
}

type EditViewProps = {
  model: string
  id: string // 'new' for create
  entity: EntityMeta
  record: Record<string, unknown>
}

// ── Per-view config (extends base HTTP contract types with React-specific fields)

export type ListConfig = BaseListConfig & {
  /** Custom cell renderer — falls back to default renderField. */
  renderCell?: (
    field: Field,
    value: unknown,
    record: Record<string, unknown>,
  ) => React.ReactNode
  /** Dynamic CSS class per row. */
  rowClassName?: (record: Record<string, unknown>) => string
  /** Full component replacement. */
  component?: ComponentType<ListViewProps>
}

export type ShowConfig = BaseShowConfig & {
  /** Custom field-value renderer. */
  renderField?: (
    field: Field,
    value: unknown,
    record: Record<string, unknown>,
  ) => React.ReactNode
  /** Full component replacement. */
  component?: ComponentType<ShowViewProps>
}

export type EditConfig = BaseEditConfig & {
  /** Custom input renderer — falls back to default FieldInput. */
  renderInput?: (
    field: Field,
    value: unknown,
    onChange: (v: unknown) => void,
  ) => React.ReactNode
  /** Full component replacement. */
  component?: ComponentType<EditViewProps>
}

export type AddConfig = BaseAddConfig & {
  /** Custom input renderer — falls back to default FieldInput. */
  renderInput?: (
    field: Field,
    value: unknown,
    onChange: (v: unknown) => void,
  ) => React.ReactNode
  /** Full component replacement. */
  component?: ComponentType<EditViewProps>
}

/** Frontend-only row action with an inline handler (not serialized). */
export type RowAction = {
  label: string
  handler: (id: string, model: string) => Promise<void> | void
  confirm?: string
  className?: string
  /** Permission required to see/use this action. Defaults to `{model}.action.{label}`. */
  permission?: string
}

// ── Entity config ─────────────────────────────────────────────────────────────

export type EntityConfig = {
  /** Display name in the sidebar. Defaults to capitalized model name. */
  label?: string
  /** Icon component shown next to the label in the sidebar. Any React component accepting `size` and `className`. */
  icon?: AdminIconComponent
  /** Show this entity in the sidebar. Defaults to true. Set false to hide internal entities. */
  sidebar?: boolean
  /** Override default permission strings for this entity. Use `false` to disable an operation entirely. */
  permissions?: EntityPermissions
  list?: ListConfig
  show?: ShowConfig
  edit?: EditConfig
  add?: AddConfig
  actions?: RowAction[]
}

// ── Permission helpers ────────────────────────────────────────────────────────

/** Returns the effective permission string for a given action, or `false` if the operation is disabled. */
export function perm(
  config: EntityConfig,
  model: string,
  action: keyof EntityPermissions,
): string | false {
  const override = config.permissions?.[action]
  if (override === false) return false
  return override ?? `${model}.${action}`
}

/** Returns the effective permission string for a custom row action. */
export function actionPerm(action: RowAction, model: string): string {
  return action.permission ?? `${model}.action.${action.label.toLowerCase()}`
}

// ── Registry ──────────────────────────────────────────────────────────────────

type EntityAdminLike = { toConfig(): EntityConfig }

const registry = new Map<string, EntityConfig>()

export const entityRegistry = {
  register(model: string, config: EntityConfig | EntityAdminLike) {
    const resolved = 'toConfig' in config ? config.toConfig() : config
    const existing = registry.get(model) ?? {}
    registry.set(model, { ...existing, ...resolved })
  },
  get(model: string): EntityConfig {
    return registry.get(model) ?? {}
  },
  has(model: string): boolean {
    return registry.has(model)
  },
  /** All registered entity names, in insertion order. */
  names(): string[] {
    return [...registry.keys()]
  },
}
