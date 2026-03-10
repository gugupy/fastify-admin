import type {
  EntityConfig,
  EntityPermissions,
  ListConfig,
  ShowConfig,
  EditConfig,
  AddConfig,
  RowAction,
} from './types.js'

/**
 * Base class for entity admin configuration.
 *
 * Extend this class to customise how an entity appears in the admin UI.
 *
 * @example
 * class UserView extends EntityView {
 *     label = 'Users';
 *     listColumns = ['id', 'name', 'email'];
 *     showFields  = ['id', 'name', 'email', 'roles'];
 *
 *     // Make read-only by disabling mutating operations:
 *     permissions = { create: false, edit: false, delete: false }
 * }
 */
export class EntityView {
  /** Sidebar display name. Defaults to capitalised entity name. */
  label?: string

  /**
   * Icon name (e.g. a HugeIcons key such as 'user-03').
   * The frontend resolves this string to the actual icon component.
   */
  icon?: string

  /** Whether to show this entity in the sidebar. Default: true. */
  sidebar = true

  // ── View customisation ────────────────────────────────────────────────────

  /** Columns shown in the list table. Empty array → show all. */
  listColumns: string[] = []

  /** Number of rows per page in the list view. Default: 20. */
  pageSize: number = 20

  /** Fields shown on the detail (show) page. Empty array → show all. */
  showFields: string[] = []

  /** Fields in the edit form. Empty array → show all editable fields. */
  editFields: string[] = []

  /** Fields in the create form. Empty array → show all editable fields. */
  addFields: string[] = []

  /** Extra row-level action buttons in the list table. */
  rowActions: RowAction[] = []

  /**
   * Relation field names to render as tabs on the show page.
   * Auto-detected from array fields if omitted.
   *
   * @example
   * relatedViews = ['orders', 'reviews']
   */
  relatedViews: string[] = []

  // ── Permission overrides ──────────────────────────────────────────────────

  /**
   * Override default permission strings.
   * Defaults: `{model}.list`, `{model}.show`, `{model}.create`, etc.
   */
  permissions: EntityPermissions = {}

  // ── Computed configs ──────────────────────────────────────────────────────

  get listConfig(): ListConfig {
    return {
      ...(this.listColumns.length ? { columns: this.listColumns } : {}),
      ...(this.pageSize !== 20 ? { pageSize: this.pageSize } : {}),
    }
  }

  get showConfig(): ShowConfig {
    return {
      ...(this.showFields.length ? { fields: this.showFields } : {}),
      ...(this.relatedViews.length ? { relatedViews: this.relatedViews } : {}),
    }
  }

  get editConfig(): EditConfig {
    return this.editFields.length ? { fields: this.editFields } : {}
  }

  get addConfig(): AddConfig {
    return this.addFields.length ? { fields: this.addFields } : {}
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  /** @internal Converts this instance to a plain (JSON-serialisable) EntityConfig. */
  toConfig(): EntityConfig {
    return {
      label: this.label,
      icon: this.icon,
      sidebar: this.sidebar,
      permissions: this.permissions,
      list: this.listConfig,
      show: this.showConfig,
      edit: this.editConfig,
      add: this.addConfig,
      actions: this.rowActions,
    }
  }
}
