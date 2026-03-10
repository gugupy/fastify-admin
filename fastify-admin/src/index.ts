// Main plugin
export { fastifyAdmin, default } from './plugin.js'

// Base class for entity admin configuration
export { EntityView } from './EntityView.js'

// User-facing registry for collecting entity views across multiple files
export { ViewRegistry } from './ViewRegistry.js'

// Built-in security entity views — extend to customise
export { UserView } from './views/user.view.js'
export { RoleView } from './views/role.view.js'
export { PermissionView } from './views/permission.view.js'

// Security entities — include in your MikroORM entity list
export { User } from './entities/user.entity.js'
export { Role } from './entities/role.entity.js'
export { Permission } from './entities/permission.entity.js'

// Types
export type {
  EntityConfig,
  EntityPermissions,
  ListConfig,
  ShowConfig,
  EditConfig,
  AddConfig,
  RowAction,
  AdminConfig,
  FastifyAdminOptions,
  ViewConfig,
} from './types.js'
