import { EntityView } from '../EntityView.js'

export class UserView extends EntityView {
  sidebar = false
  icon = 'User03'

  listColumns() {
    return ['id', 'fullName', 'email', 'roles']
  }

  showFields() {
    return ['id', 'username', 'fullName', 'email', 'role.name']
  }

  editFields() {
    return ['fullName', 'roles.name']
  }

  addFields() {
    return ['username', 'fullName', 'email', 'password', 'roles']
  }
}
