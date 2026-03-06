import { entityRegistry } from './entityRegistry'
import type { EntityConfig, Operation } from './entityRegistry'
import type { AdminResource } from './AdminResource'
import type { IconSvgElement } from '@hugeicons/react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type OAuthConfig = {
  google?: boolean
  github?: boolean
  microsoft?: boolean
}

/** Shape of the /api/admin-config response */
type ApiAdminConfig = {
  name: string
  signup: boolean
  requireEmailVerification: boolean
  securityEntities: string[]
  oauth: { google: boolean; github: boolean; microsoft: boolean }
  entities: Record<
    string,
    {
      label?: string
      icon?: string
      sidebar?: boolean
      operations?: string[]
      permissions?: Record<string, string>
      list?: { columns?: string[] }
      show?: { fields?: string[] }
      edit?: { fields?: string[] }
      add?: { fields?: string[] }
      actions?: { label: string; href: string }[]
    }
  >
}

/** Maps string icon names (from the server config) to React icon components. */
export type IconMap = Record<string, IconSvgElement>

export type FastifyAdminConfig = {
  /** Application name shown in the sidebar and auth pages. Default: 'FastifyAdmin' */
  name?: string

  /** Icon component shown in the sidebar header and auth pages. Default: built-in icon */
  icon?: IconSvgElement

  /** Allow users to self-register via /signup. Default: true */
  signup?: boolean

  /** Require email OTP on signup. Mirrors server setting. Default: false */
  requireEmailVerification?: boolean

  /**
   * OAuth providers shown on login/signup pages.
   * Only enable a provider if its credentials are configured on the server.
   */
  oauth?: OAuthConfig

  /**
   * Entity names treated as internal security/system entities.
   * They are hidden from the sidebar and blocked via URL.
   * Default: ['user', 'role', 'permission']
   */
  securityEntities?: string[]
}

// ── Singleton ─────────────────────────────────────────────────────────────────

let _instance: FastifyAdmin | null = null

/** Returns the active FastifyAdmin instance. Falls back to defaults if not yet booted. */
export function getAdmin(): FastifyAdmin {
  if (!_instance) setAdminInstance(new FastifyAdmin())
  return _instance!
}

function setAdminInstance(admin: FastifyAdmin) {
  _instance = admin
}

// ── Class ─────────────────────────────────────────────────────────────────────

export class FastifyAdmin {
  readonly name: string
  readonly icon?: IconSvgElement
  readonly signup: boolean
  readonly requireEmailVerification: boolean
  readonly oauth: Required<OAuthConfig>
  readonly securityEntities: string[]

  private _resources = new Map<string, AdminResource | EntityConfig>()

  constructor(config: FastifyAdminConfig = {}) {
    this.name = config.name ?? 'FastifyAdmin'
    this.icon = config.icon
    this.signup = config.signup ?? true
    this.requireEmailVerification = config.requireEmailVerification ?? false
    this.oauth = {
      google: config.oauth?.google ?? false,
      github: config.oauth?.github ?? false,
      microsoft: config.oauth?.microsoft ?? false,
    }
    this.securityEntities = config.securityEntities ?? [
      'user',
      'role',
      'permission',
    ]
  }

  /**
   * Register an entity resource config (for local overrides like React icon components).
   * Returns `this` for fluent chaining.
   */
  resource(name: string, resource: AdminResource | EntityConfig): this {
    this._resources.set(name, resource)
    return this
  }

  /**
   * Finalizes configuration and registers all resources.
   * Use this approach when you want full control over entity configs locally.
   */
  boot(): void {
    setAdminInstance(this)
    for (const name of this.securityEntities) {
      entityRegistry.register(name, { sidebar: false })
    }
    for (const [name, resource] of this._resources) {
      entityRegistry.register(name, resource)
    }
  }

  /**
   * Fetch admin config from `/api/admin-config` and initialise the singleton + registry.
   *
   * Use this in `main.tsx` when the admin config is provided by the `fastify-admin` npm package.
   *
   * @param iconMap     Optional mapping of string icon names → React icon components.
   * @param localConfig Optional local overrides applied on top of the API config.
   */
  static async initFromApi(
    iconMap?: IconMap,
    localConfig?: FastifyAdminConfig & {
      resources?: Record<string, EntityConfig>
    },
  ): Promise<FastifyAdmin> {
    const res = await fetch('/api/admin-config')
    const apiConfig: ApiAdminConfig = await res.json()

    const admin = new FastifyAdmin({
      name: localConfig?.name ?? apiConfig.name,
      icon: localConfig?.icon,
      signup: localConfig?.signup ?? apiConfig.signup,
      requireEmailVerification:
        localConfig?.requireEmailVerification ??
        apiConfig.requireEmailVerification,
      oauth: localConfig?.oauth ?? apiConfig.oauth,
      securityEntities:
        localConfig?.securityEntities ?? apiConfig.securityEntities,
    })

    setAdminInstance(admin)

    // Populate entity registry from API config
    for (const [entityName, cfg] of Object.entries(apiConfig.entities)) {
      const iconComponent = cfg.icon && iconMap ? iconMap[cfg.icon] : undefined
      entityRegistry.register(entityName, {
        label: cfg.label,
        icon: iconComponent,
        sidebar: cfg.sidebar,
        operations: cfg.operations as Operation[],
        permissions: cfg.permissions,
        list: cfg.list,
        show: cfg.show,
        edit: cfg.edit,
        add: cfg.add,
      })
    }

    // Security entities: hidden from main nav (sidebar: false) but still accessible via RBAC
    for (const secName of admin.securityEntities) {
      entityRegistry.register(secName, { sidebar: false })
    }

    // Apply local overrides on top (e.g. custom React icon components)
    if (localConfig?.resources) {
      for (const [entityName, cfg] of Object.entries(localConfig.resources)) {
        entityRegistry.register(entityName, cfg)
      }
    }

    return admin
  }
}
