// Main plugin
export { createAdminPlugin, default } from './plugin.js';

// Base class for entity configuration
export { AdminResource } from './AdminResource.js';

// Security entities — include in your MikroORM entity list
export { User } from './entities/user.entity.js';
export { Role } from './entities/role.entity.js';
export { Permission } from './entities/permission.entity.js';

// Types
export type {
    Operation,
    EntityConfig,
    EntityPermissions,
    ListConfig,
    ShowConfig,
    EditConfig,
    AddConfig,
    RowAction,
    AdminConfig,
    FastifyAdminOptions,
    ResourceConfig,
} from './types.js';

export { ALL_OPERATIONS } from './types.js';
