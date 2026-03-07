#!/usr/bin/env node
/**
 * Seeds a demo user for the hosted demo deployment.
 * Idempotent — skips creation if the user already exists.
 *
 * Credentials:
 *   Email:    demo@example.com
 *   Password: demo1234
 */
import { initORM } from '../db.js'
import { createAdminUser } from '../cli/index.js'
import { User } from '../entities/user.entity.js'

const DEMO_EMAIL = 'demo@example.com'
const DEMO_PASSWORD = 'demo1234'

const { orm } = await initORM()
const em = orm.em.fork()

const existing = await em.findOne(User, { email: DEMO_EMAIL })
if (existing) {
  console.log(`Demo user already exists (${DEMO_EMAIL}). Skipping.`)
  await orm.close()
  process.exit(0)
}

const { user, adminRole } = await createAdminUser(em, {
  fullName: 'Demo User',
  username: 'demo',
  email: DEMO_EMAIL,
  password: DEMO_PASSWORD,
})

await orm.close()
console.log(
  `✓ Demo user "${user.fullName}" <${user.email}> created${adminRole ? ' with Admin role' : ''}.`,
)
