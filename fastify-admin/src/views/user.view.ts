import { EntityView } from '../EntityView.js'

export class UserView extends EntityView {
  sidebar = false
  icon = 'User'

  relatedViews = ['role']

  listColumns = ['id', 'fullName', 'email']
  showFields = ['id', 'username', 'fullName', 'email', 'roles.name']
  editFields = ['fullName', 'roles.name']
  addFields = ['username', 'fullName', 'email', 'password', 'roles']
}
