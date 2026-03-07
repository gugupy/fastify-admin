import { EntityManager } from '@mikro-orm/core'
import { Permission } from './entities/permission.entity.js'
import { Role } from './entities/role.entity.js'
import { EntityRegistry } from './registry.js'

const ENTITY_ACTIONS = ['list', 'show', 'create', 'edit', 'delete'] as const
const VIEWER_ACTIONS = new Set(['list', 'show'])

/** Web-level permissions that control profile/account actions in the UI. */
export const WEB_PERMISSIONS = [
  'profile.edit',
  'profile.email',
  'password.change',
  'mfa.manage',
] as const

export async function seedRbac(
  em: EntityManager,
  registry: EntityRegistry,
  securityEntities: string[] = ['user', 'role', 'permission'],
) {
  const fork = em.fork()
  const securityEntitySet = new Set(securityEntities)

  const entityPermNames: string[] = []
  for (const entity of registry.getAll()) {
    for (const action of ENTITY_ACTIONS) {
      entityPermNames.push(`${entity.name}.${action}`)
    }
  }

  const allExpected = [...entityPermNames, ...WEB_PERMISSIONS]

  // Upsert all permissions
  const existing = await fork.find(Permission, { name: { $in: allExpected } })
  const existingNames = new Set(existing.map((p) => p.name))
  const newPerms: Permission[] = []
  for (const name of allExpected) {
    if (!existingNames.has(name)) {
      newPerms.push(fork.create(Permission, { name }))
    }
  }
  if (newPerms.length) await fork.persistAndFlush(newPerms)

  const allPerms = await fork.find(Permission, { name: { $in: allExpected } })
  const entityPermSet = new Set(entityPermNames)

  // ── Admin role: all permissions (entity + web) ──────────────────────────────
  const adminRole = await ensureRole(fork, 'Admin')
  const adminHas = new Set(adminRole.permissions.getItems().map((p) => p.name))
  const adminToAdd = allPerms.filter((p) => !adminHas.has(p.name))
  if (adminToAdd.length) {
    for (const p of adminToAdd) adminRole.permissions.add(p)
    await fork.flush()
  }

  // ── Viewer role (default): list+show for non-security entities + web perms ──
  const viewerRole = await ensureRole(fork, 'Viewer')
  const viewerHas = new Set(
    viewerRole.permissions.getItems().map((p) => p.name),
  )
  const viewerToAdd = allPerms.filter((p) => {
    if (viewerHas.has(p.name)) return false
    if (WEB_PERMISSIONS.includes(p.name as (typeof WEB_PERMISSIONS)[number]))
      return true
    const [entity, action] = p.name.split('.')
    return !securityEntitySet.has(entity) && VIEWER_ACTIONS.has(action)
  })
  if (viewerToAdd.length) {
    for (const p of viewerToAdd) viewerRole.permissions.add(p)
    await fork.flush()
  }

  // ── Demo role: full CRUD on non-security entities, read-only on security entities, no web perms ──
  const demoRole = await ensureRole(fork, 'Demo')
  const demoHas = new Set(demoRole.permissions.getItems().map((p) => p.name))
  const demoToAdd = allPerms.filter((p) => {
    if (!entityPermSet.has(p.name) || demoHas.has(p.name)) return false
    const [entity, action] = p.name.split('.')
    if (securityEntitySet.has(entity)) return VIEWER_ACTIONS.has(action)
    return true
  })
  if (demoToAdd.length) {
    for (const p of demoToAdd) demoRole.permissions.add(p)
    await fork.flush()
  }

  console.log(
    `[rbac] ${allExpected.length} permissions ensured, Admin + Viewer + Demo roles synced.`,
  )
}

async function ensureRole(fork: EntityManager, name: string) {
  let role = await fork.findOne(Role, { name }, { populate: ['permissions'] })
  if (!role) {
    const created = fork.create(Role, { name })
    await fork.persistAndFlush(created)
    await fork.populate(created, ['permissions'])
    role = created as unknown as typeof role
  }
  return role!
}
