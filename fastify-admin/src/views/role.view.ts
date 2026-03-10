import { EntityView } from '../EntityView.js'

export class RoleView extends EntityView {
  sidebar = false
  icon = 'ShieldUser'

  listColumns() {
    return ['id', 'name']
  }

  showFields() {
    return ['id', 'name', 'permissions.name']
  }

  permissions() {
    return {
      create: false as const,
      edit: false as const,
      delete: false as const,
    }
  }
}
