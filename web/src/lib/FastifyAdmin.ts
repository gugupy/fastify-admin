import { entityRegistry } from './entityRegistry'
import type { EntityConfig } from './entityRegistry'
import { iconRegistry } from './iconRegistry'
import type { AdminIconComponent, AdminIcons } from './iconRegistry'
import { menuRegistry } from './menuRegistry'
import type { AdminConfig } from '@fastify-admin/types'

// ── Types ─────────────────────────────────────────────────────────────────────

export type OAuthConfig = {
  google?: boolean
  github?: boolean
  microsoft?: boolean
}

export type FastifyAdminConfig = {
  /** Application name shown in the sidebar and auth pages. Default: 'FastifyAdmin' */
  name?: string

  /** Icon component shown in the sidebar header and auth pages. Default: built-in icon */
  icon?: AdminIconComponent

  /**
   * Override named UI icons used throughout the admin panel.
   * Works with any React icon library (Lucide, Heroicons, Phosphor, etc.).
   *
   * @example
   * import { Trash2, Pencil } from 'lucide-react'
   * icons: { delete: Trash2, edit: Pencil }
   */
  icons?: Partial<AdminIcons>

  /** Allow users to self-register via /signup. Default: true */
  signup?: boolean

  /** Require email OTP on signup. Mirrors server setting. Default: false */
  requireEmailVerification?: boolean

  /** Whether email sending is available on the server. Controls MFA and email verification. Default: false */
  mfaEnabled?: boolean

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
  readonly icon?: AdminIconComponent
  readonly signup: boolean
  readonly requireEmailVerification: boolean
  readonly mfaEnabled: boolean
  readonly oauth: Required<OAuthConfig>
  readonly securityEntities: string[]

  constructor(config: FastifyAdminConfig = {}) {
    this.name = config.name ?? 'FastifyAdmin'
    this.icon = config.icon
    this.signup = config.signup ?? true
    this.requireEmailVerification = config.requireEmailVerification ?? false
    this.mfaEnabled = config.mfaEnabled ?? false
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
    if (config.icons) iconRegistry.override(config.icons)
  }

  /**
   * Fetch admin config from `/api/admin-config` and initialise the singleton + registry.
   *
   * Use this in `main.tsx` when the admin config is provided by the `fastify-admin` npm package.
   * Entity icons are resolved automatically from `iconRegistry.registerEntityIcons()`.
   *
   * @param localConfig Optional local overrides applied on top of the API config.
   */
  static async initFromApi(
    localConfig?: FastifyAdminConfig & {
      resources?: Record<string, EntityConfig>
    },
  ): Promise<FastifyAdmin> {
    const res = await fetch('/api/admin-config')
    const apiConfig: AdminConfig = await res.json()

    const admin = new FastifyAdmin({
      name: localConfig?.name ?? apiConfig.name,
      icon: localConfig?.icon,
      signup: localConfig?.signup ?? apiConfig.signup,
      requireEmailVerification:
        localConfig?.requireEmailVerification ??
        apiConfig.requireEmailVerification,
      mfaEnabled: localConfig?.mfaEnabled ?? apiConfig.mfaEnabled,
      oauth: localConfig?.oauth ?? apiConfig.oauth,
      securityEntities:
        localConfig?.securityEntities ?? apiConfig.securityEntities,
    })

    setAdminInstance(admin)

    // Populate entity registry from API config
    for (const [entityName, cfg] of Object.entries(apiConfig.entities)) {
      const iconComponent = cfg.icon
        ? iconRegistry.getEntityIcon(cfg.icon)
        : undefined
      entityRegistry.register(entityName, {
        label: cfg.label,
        icon: iconComponent,
        sidebar: cfg.sidebar,
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

    // Populate menu registry from API config — resolving icon strings to components.
    // 'security' is a built-in AdminIconKey slot; all others go through entityIconMap.
    menuRegistry.populate(
      (apiConfig.menu ?? []).map((item) => ({
        ...item,
        iconComponent: item.icon
          ? (item.icon === 'security'
              ? iconRegistry.get('security')
              : iconRegistry.getEntityIcon(item.icon))
          : undefined,
      })),
    )

    // Apply local overrides on top (e.g. custom React icon components)
    if (localConfig?.resources) {
      for (const [entityName, cfg] of Object.entries(localConfig.resources)) {
        entityRegistry.register(entityName, cfg)
      }
    }

    return admin
  }
}
