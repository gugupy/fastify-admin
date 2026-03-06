import {
  ALL_OPERATIONS,
  type EntityConfig,
  type EntityPermissions,
  type ListConfig,
  type ShowConfig,
  type EditConfig,
  type AddConfig,
  type RowAction,
  type Operation,
} from './types.js'

/**
 * Base class for entity admin configuration.
 *
 * Extend this class to customise how an entity appears in the admin UI.
 *
 * @example
 * class ProductResource extends AdminResource {
 *     label = 'Products';
 *     operations: Operation[] = ['list', 'show'];   // read-only
 *
 *     listColumns() { return ['id', 'name', 'price']; }
 *     showFields()  { return ['id', 'name', 'price', 'description']; }
 * }
 */
export class AdminResource {
  /** Sidebar display name. Defaults to capitalised entity name. */
  label?: string

  /**
   * Icon name (e.g. a HugeIcons key such as 'user-03').
   * The frontend resolves this string to the actual icon component.
   */
  icon?: string

  /** Whether to show this entity in the sidebar. Default: true. */
  sidebar = true

  /**
   * Which CRUD operations are enabled.
   * Controls New / Edit / Delete / View buttons and route guards.
   * Default: all operations.
   */
  operations: Operation[] = [...ALL_OPERATIONS]

  // ── View customisation ────────────────────────────────────────────────────

  /** Columns shown in the list table. Empty array → show all. */
  listColumns(): string[] {
    return []
  }

  /** Fields shown on the detail (show) page. Empty array → show all. */
  showFields(): string[] {
    return []
  }

  /** Fields in the edit form. Empty array → show all editable fields. */
  editFields(): string[] {
    return []
  }

  /** Fields in the create form. Empty array → show all editable fields. */
  addFields(): string[] {
    return []
  }

  /** Extra row-level action buttons in the list table. */
  rowActions(): RowAction[] {
    return []
  }

  // ── Permission overrides ──────────────────────────────────────────────────

  /**
   * Override default permission strings.
   * Defaults: `{model}.list`, `{model}.show`, `{model}.create`, etc.
   */
  permissions(): EntityPermissions {
    return {}
  }

  // ── Computed configs ──────────────────────────────────────────────────────

  get listConfig(): ListConfig {
    const cols = this.listColumns()
    return cols.length ? { columns: cols } : {}
  }

  get showConfig(): ShowConfig {
    const fields = this.showFields()
    return fields.length ? { fields } : {}
  }

  get editConfig(): EditConfig {
    const fields = this.editFields()
    return fields.length ? { fields } : {}
  }

  get addConfig(): AddConfig {
    const fields = this.addFields()
    return fields.length ? { fields } : {}
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  /** @internal Converts this instance to a plain (JSON-serialisable) EntityConfig. */
  toConfig(): EntityConfig {
    return {
      label: this.label,
      icon: this.icon,
      sidebar: this.sidebar,
      operations: this.operations,
      permissions: this.permissions(),
      list: this.listConfig,
      show: this.showConfig,
      edit: this.editConfig,
      add: this.addConfig,
      actions: this.rowActions(),
    }
  }
}
