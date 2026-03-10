import { EntityView } from '../EntityView.js'

export class UserView extends EntityView {
  sidebar = false
  icon = 'User03'

  listColumns = ['id', 'fullName', 'email']
  showFields = ['id', 'username', 'fullName', 'email', 'roles.name']
  editFields = ['fullName', 'roles.name']
  addFields = ['username', 'fullName', 'email', 'password', 'roles']
}
