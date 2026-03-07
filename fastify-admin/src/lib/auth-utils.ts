import { EntityManager } from '@mikro-orm/core'
import { User } from '../entities/user.entity.js'

export async function loadPermissions(
  em: EntityManager,
  userId: number,
): Promise<string[]> {
  const user = await em.findOne(
    User,
    { id: userId },
    { populate: ['roles', 'roles.permissions'] },
  )
  if (!user) return []
  const names = new Set<string>()
  for (const role of user.roles) {
    for (const perm of role.permissions) {
      names.add(perm.name)
    }
  }
  return [...names]
}

/**
 * Returns true if the user is allowed to perform the action.
 * Users with no roles are always allowed (no restrictions applied).
 * Users with roles must explicitly have the permission.
 */
export async function hasPermission(
  em: EntityManager,
  userId: number,
  permission: string,
): Promise<boolean> {
  const user = await em.findOne(
    User,
    { id: userId },
    { populate: ['roles', 'roles.permissions'] },
  )
  if (!user || user.roles.length === 0) return true
  const names = new Set<string>()
  for (const role of user.roles) {
    for (const perm of role.permissions) {
      names.add(perm.name)
    }
  }
  return names.has(permission)
}

export async function generateUsername(
  em: EntityManager,
  email: string,
): Promise<string> {
  const base =
    email
      .split('@')[0]
      .replace(/[^a-z0-9_]/gi, '')
      .toLowerCase() || 'user'
  let username = base
  let i = 1
  while (await em.findOne(User, { username })) {
    username = `${base}${i++}`
  }
  return username
}
