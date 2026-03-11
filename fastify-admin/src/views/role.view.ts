import { EntityView } from '../entityView.js'

export class RoleView extends EntityView {
  sidebar = false
  icon = 'ShieldUser'

  listColumns = ['id', 'name']
  showFields = ['id', 'name', 'permissions.name']
  permissions = {
    create: false as const,
    edit: false as const,
    delete: false as const,
  }
}
