import { EntityView } from '../EntityView.js'

export class PermissionView extends EntityView {
  sidebar = false
  icon = 'LockKey'

  listColumns = ['id', 'name']
  permissions = {
    show: false as const,
    create: false as const,
    edit: false as const,
    delete: false as const,
  }
}
