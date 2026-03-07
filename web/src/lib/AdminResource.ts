import type { IconSvgElement } from '@hugeicons/react'
import type {
  EntityConfig,
  EntityPermissions,
  ListConfig,
  ShowConfig,
  EditConfig,
  AddConfig,
  RowAction,
  Operation,
} from './entityRegistry'
import { ALL_OPERATIONS } from './entityRegistry'

/**
 * Base class for entity admin configuration.
 *
 * Override properties and methods to customize how an entity
 * appears and behaves in the admin UI.
 *
 * @example
 * class ProductResource extends AdminResource {
 *     label = 'Products';
 *     operations: Operation[] = ['list', 'show']; // read-only
 *
 *     listColumns() { return ['id', 'name', 'price']; }
 *     showFields()  { return ['id', 'name', 'price', 'description']; }
 * }
 *
 * entityRegistry.register('product', new ProductResource());
 */
export class AdminResource {
  /** Sidebar display name. Defaults to capitalized entity name. */
  label?: string

  /** Icon shown in the sidebar next to the label. */
  icon?: IconSvgElement

  /** Whether to show this entity in the sidebar. Default: true. */
  sidebar = true

  /**
   * Which CRUD operations are enabled for this entity.
   * Controls visibility of New / Edit / Delete / View buttons and route guards.
   * Default: all operations.
   */
  operations: Operation[] = [...ALL_OPERATIONS]

  // ── View customization ──────────────────────────────────────────────────

  /** Columns shown in the list table. Return empty array to show all. */
  listColumns(): string[] {
    return []
  }

  /** Fields shown on the detail (show) page. Return empty array to show all. */
  showFields(): string[] {
    return []
  }

  /** Fields included in the edit form. Return empty array to show all editable fields. */
  editFields(): string[] {
    return []
  }

  /** Fields included in the create (add) form. Return empty array to show all editable fields. */
  addFields(): string[] {
    return []
  }

  /** Custom row actions shown as extra buttons in the list table. */
  rowActions(): RowAction[] {
    return []
  }

  // ── Permission overrides ────────────────────────────────────────────────

  /**
   * Override the default permission strings for any action.
   * By default: `{model}.list`, `{model}.show`, `{model}.create`, `{model}.edit`, `{model}.delete`.
   */
  permissions(): EntityPermissions {
    return {}
  }

  // ── Advanced overrides ──────────────────────────────────────────────────

  /** Full list view config override. Merges with listColumns(). */
  get listConfig(): ListConfig {
    const cols = this.listColumns()
    return cols.length ? { columns: cols } : {}
  }

  /** Full show view config override. Merges with showFields(). */
  get showConfig(): ShowConfig {
    const fields = this.showFields()
    return fields.length ? { fields } : {}
  }

  /** Full edit view config override. Merges with editFields(). */
  get editConfig(): EditConfig {
    const fields = this.editFields()
    return fields.length ? { fields } : {}
  }

  /** Full add view config override. Merges with addFields(). */
  get addConfig(): AddConfig {
    const fields = this.addFields()
    return fields.length ? { fields } : {}
  }

  // ── Internal ────────────────────────────────────────────────────────────

  /** @internal Converts this instance to a plain EntityConfig object. */
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
