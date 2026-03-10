import { ViewRegistry } from '../ViewRegistry.js'
import { UserView } from './user.view.js'
import { RoleView } from './role.view.js'
import { PermissionView } from './permission.view.js'

export const views = new ViewRegistry()
  .register('user', new UserView())
  .register('role', new RoleView())
  .register('permission', new PermissionView())
