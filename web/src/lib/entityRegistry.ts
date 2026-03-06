import type { ComponentType } from "react";
import type { Field, EntityMeta } from "../types/entity";
import type { IconSvgElement } from "@hugeicons/react";

// ── Shared prop shapes ────────────────────────────────────────────────────────

export type ListViewProps = {
  model: string;
  entity: EntityMeta;
  records: Record<string, unknown>[];
};

export type ShowViewProps = {
  model: string;
  id: string;
  entity: EntityMeta;
  record: Record<string, unknown>;
};

export type EditViewProps = {
  model: string;
  id: string; // 'new' for create
  entity: EntityMeta;
  record: Record<string, unknown>;
};

// ── Per-view config ───────────────────────────────────────────────────────────

export type ListConfig = {
  /** Restrict / reorder columns by field name. */
  columns?: string[];
  /** Custom cell renderer — falls back to default renderField. */
  renderCell?: (
    field: Field,
    value: unknown,
    record: Record<string, unknown>,
  ) => React.ReactNode;
  /** Dynamic CSS class per row. */
  rowClassName?: (record: Record<string, unknown>) => string;
  /** Full component replacement. */
  component?: ComponentType<ListViewProps>;
};

export type ShowConfig = {
  /** Restrict / reorder fields shown. */
  fields?: string[];
  /** Custom field-value renderer. */
  renderField?: (
    field: Field,
    value: unknown,
    record: Record<string, unknown>,
  ) => React.ReactNode;
  /** Full component replacement. */
  component?: ComponentType<ShowViewProps>;
};

export type EditConfig = {
  /** Restrict / reorder editable fields. */
  fields?: string[];
  /** Custom input renderer — falls back to default FieldInput. */
  renderInput?: (
    field: Field,
    value: unknown,
    onChange: (v: unknown) => void,
  ) => React.ReactNode;
  /** Full component replacement. */
  component?: ComponentType<EditViewProps>;
};

export type AddConfig = {
  /** Restrict / reorder editable fields. */
  fields?: string[];
  /** Custom input renderer — falls back to default FieldInput. */
  renderInput?: (
    field: Field,
    value: unknown,
    onChange: (v: unknown) => void,
  ) => React.ReactNode;
  /** Full component replacement. */
  component?: ComponentType<EditViewProps>;
};

export type RowAction = {
  label: string;
  handler: (id: string, model: string) => Promise<void> | void;
  confirm?: string;
  className?: string;
  /** Permission required to see/use this action. Defaults to `{model}.action.{label}`. */
  permission?: string;
};

// ── RBAC permission overrides per entity ──────────────────────────────────────

export type EntityPermissions = {
  /** Permission to view the list. Default: `{model}.list` */
  list?: string;
  /** Permission to view a single record. Default: `{model}.show` */
  show?: string;
  /** Permission to create a record. Default: `{model}.create` */
  create?: string;
  /** Permission to edit a record. Default: `{model}.edit` */
  edit?: string;
  /** Permission to delete a record. Default: `{model}.delete` */
  delete?: string;
};

// ── Operations ────────────────────────────────────────────────────────────────

/** Which CRUD operations are available for an entity. Controls UI buttons/routes. */
export type Operation = "list" | "show" | "create" | "edit" | "delete";

export const ALL_OPERATIONS: Operation[] = [
  "list",
  "show",
  "create",
  "edit",
  "delete",
];

// ── Entity config (all views together) ───────────────────────────────────────

export type EntityConfig = {
  /** Display name in the sidebar. Defaults to capitalized model name. */
  label?: string;
  /** Icon component shown next to the label in the sidebar. */
  icon?: IconSvgElement;
  /** Show this entity in the sidebar. Defaults to true. Set false to hide internal entities. */
  sidebar?: boolean;
  /**
   * Which CRUD operations are enabled. Defaults to all.
   * Controls visibility of New / Edit / Delete buttons and route access.
   */
  operations?: Operation[];
  /** Override default permission strings for this entity. */
  permissions?: EntityPermissions;
  list?: ListConfig;
  show?: ShowConfig;
  edit?: EditConfig;
  add?: AddConfig;
  actions?: RowAction[];
};

// ── Permission helpers ────────────────────────────────────────────────────────

/** Returns the effective permission string for a given action, respecting overrides. */
export function perm(
  config: EntityConfig,
  model: string,
  action: keyof EntityPermissions,
): string {
  return config.permissions?.[action] ?? `${model}.${action}`;
}

/** Returns the effective permission string for a custom row action. */
export function actionPerm(action: RowAction, model: string): string {
  return action.permission ?? `${model}.action.${action.label.toLowerCase()}`;
}

// ── Registry ──────────────────────────────────────────────────────────────────

// Import lazily to avoid circular deps — AdminResource imports from this file
type EntityAdminLike = { toConfig(): EntityConfig };

const registry = new Map<string, EntityConfig>();

export const entityRegistry = {
  register(model: string, config: EntityConfig | EntityAdminLike) {
    const resolved = "toConfig" in config ? config.toConfig() : config;
    const existing = registry.get(model) ?? {};
    registry.set(model, { ...existing, ...resolved });
  },
  get(model: string): EntityConfig {
    return registry.get(model) ?? {};
  },
  has(model: string): boolean {
    return registry.has(model);
  },
};
