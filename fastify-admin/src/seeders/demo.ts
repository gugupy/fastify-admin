#!/usr/bin/env node
/**
 * Seeds a demo user for the hosted demo deployment.
 * Idempotent — creates the user if missing, assigns Demo role if not already set.
 *
 * Credentials:
 *   Email:    demo@example.com
 *   Password: demo1234
 *
 * The demo user is assigned the "Demo" role which grants entity CRUD access
 * but blocks profile/password/MFA changes.
 *
 * Safe to run before or after the server has started — creates the Demo role
 * if it doesn't exist yet (permissions are synced on the next server start).
 */
import { initORM } from '../db.js'
import { User } from '../entities/user.entity.js'
import { Role } from '../entities/role.entity.js'
import { hashPassword } from '../lib/password.js'

const DEMO_EMAIL = 'demo@example.com'
const DEMO_PASSWORD = 'demo1234'

const { orm } = await initORM()
const em = orm.em.fork()

// Ensure Demo role exists, then fetch with populate
if (!(await em.findOne(Role, { name: 'Demo' }))) {
  await em.persistAndFlush(em.create(Role, { name: 'Demo' }))
  console.log(
    'Demo role created (permissions will be synced on next server start).',
  )
}
const demoRole = await em.findOneOrFail(
  Role,
  { name: 'Demo' },
  { populate: ['users'] },
)

// Ensure demo user exists, then fetch with populate
if (!(await em.findOne(User, { email: DEMO_EMAIL }))) {
  await em.persistAndFlush(
    em.create(User, {
      fullName: 'Demo User',
      username: 'demo',
      email: DEMO_EMAIL,
      password: await hashPassword(DEMO_PASSWORD),
    }),
  )
  console.log(`✓ Demo user created: ${DEMO_EMAIL}`)
} else {
  console.log(`Demo user already exists (${DEMO_EMAIL}).`)
}
const user = await em.findOneOrFail(
  User,
  { email: DEMO_EMAIL },
  { populate: ['roles'] },
)

// Assign Demo role if not already assigned
const hasRole = user.roles.getItems().some((r) => r.name === 'Demo')
if (!hasRole) {
  demoRole.users.add(user)
  await em.flush()
  console.log('✓ Demo role assigned.')
} else {
  console.log('Demo role already assigned. Nothing to do.')
}

await orm.close()
