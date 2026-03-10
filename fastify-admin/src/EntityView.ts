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
 *
 *     listColumns() { return ['id', 'name', 'email']; }
 *     showFields()  { return ['id', 'name', 'email', 'roles']; }
 *
 *     // Make read-only by disabling mutating operations:
 *     permissions() { return { create: false, edit: false, delete: false } }
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
  listColumns(): string[] {
    return []
  }

  /** Number of rows per page in the list view. Default: 20. */
  pageSize(): number {
    return 20
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

  /**
   * Entity classes to render as relation tabs on the show page.
   * Auto-detected from array fields if omitted.
   *
   * @example
   * relatedViews() { return [Order, Review] }
   */
  relatedViews(): (abstract new (...args: any[]) => any)[] {
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
    const size = this.pageSize()
    return {
      ...(cols.length ? { columns: cols } : {}),
      ...(size !== 20 ? { pageSize: size } : {}),
    }
  }

  get showConfig(): ShowConfig {
    const fields = this.showFields()
    const related = this.relatedViews()
    return {
      ...(fields.length ? { fields } : {}),
      ...(related.length
        ? { relatedViews: related.map((e) => e.name.toLowerCase()) }
        : {}),
    }
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
      permissions: this.permissions(),
      list: this.listConfig,
      show: this.showConfig,
      edit: this.editConfig,
      add: this.addConfig,
      actions: this.rowActions(),
    }
  }
}
