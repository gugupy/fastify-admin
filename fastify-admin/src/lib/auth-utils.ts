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
