#!/usr/bin/env node
import { pathToFileURL } from 'url'
import type { EntityManager } from '@mikro-orm/core'
import { initORM } from '../db.js'
import { User } from '../entities/user.entity.js'
import { Role } from '../entities/role.entity.js'
import { hashPassword } from '../lib/password.js'

// ── Exported business logic ───────────────────────────────────────────────────

export async function createAdminUser(
  em: EntityManager,
  data: { fullName: string; username: string; email: string; password: string },
): Promise<{ user: User; adminRole: Role | null }> {
  const user = em.create(User, {
    fullName: data.fullName,
    username: data.username,
    email: data.email,
    password: await hashPassword(data.password),
  })
  await em.persist(user).flush()

  const adminRole = await em.findOne(
    Role,
    { name: 'Admin' },
    { populate: ['users'] },
  )
  if (adminRole) {
    adminRole.users.add(user)
    await em.flush()
  }
  return { user, adminRole }
}

export async function resetUserPassword(
  em: EntityManager,
  email: string,
  newPassword: string,
): Promise<User> {
  const user = await em.findOne(User, { email })
  if (!user) throw new Error(`No user found with email "${email}".`)
  user.password = await hashPassword(newPassword)
  await em.flush()
  return user
}

// ── Interactive CLI (only runs when executed directly) ────────────────────────

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { createInterface } = await import('readline')

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  })

  function ask(question: string): Promise<string> {
    return new Promise((resolve) => {
      rl.question(question, (answer) => resolve(answer.trim()))
    })
  }

  function askHidden(question: string): Promise<string> {
    return new Promise((resolve) => {
      let promptShown = false
      ;(rl as any)._writeToOutput = (s: string) => {
        if (!promptShown) {
          process.stdout.write(s)
          promptShown = true
          return
        }
        if (s === '\r\n' || s === '\n' || s === '\r') process.stdout.write('\n')
      }
      rl.question(question, (answer) => {
        ;(rl as any)._writeToOutput = (s: string) => process.stdout.write(s)
        resolve(answer.trim())
      })
    })
  }

  async function runCreateAdmin() {
    console.log('\nFastify Admin — Create Admin User')
    console.log('─'.repeat(34) + '\n')

    const { orm } = await initORM()
    const em = orm.em.fork()

    let email: string
    while (true) {
      email = await ask('Email:     ')
      if (!email || !email.includes('@')) {
        console.log('  Please enter a valid email address.')
        continue
      }
      if (await em.findOne(User, { email })) {
        console.log('  Email is already taken.')
        continue
      }
      break
    }

    let username: string
    while (true) {
      username = await ask('Username:  ')
      if (!username || username.length < 2) {
        console.log('  Username must be at least 2 characters.')
        continue
      }
      if (await em.findOne(User, { username })) {
        console.log('  Username is already taken.')
        continue
      }
      break
    }

    let fullName: string
    while (true) {
      fullName = await ask('Full name: ')
      if (fullName) break
      console.log('  Full name cannot be empty.')
    }

    let password: string
    while (true) {
      password = await askHidden('Password:  ')
      if (password.length >= 8) break
      console.log('  Password must be at least 8 characters.')
    }

    rl.close()
    console.log('\nCreating user…')

    const { user, adminRole } = await createAdminUser(em, {
      fullName,
      username,
      email,
      password,
    })

    if (!adminRole) {
      console.warn(
        '\nWarning: "Admin" role not found. Start the server once to seed roles, then re-run.',
      )
    }

    await orm.close()
    console.log(
      `\n✓ User "${user.fullName}" <${user.email}> created${adminRole ? ' with Admin role' : ''}.`,
    )
  }

  async function runResetPassword() {
    console.log('\nFastify Admin — Reset Password')
    console.log('─'.repeat(30) + '\n')

    let email: string
    while (true) {
      email = await ask('Email:        ')
      if (email && email.includes('@')) break
      console.log('  Please enter a valid email address.')
    }

    let newPassword: string
    while (true) {
      newPassword = await askHidden('New password: ')
      if (newPassword.length < 8) {
        console.log('  Password must be at least 8 characters.')
        continue
      }
      const confirm = await askHidden('Confirm:      ')
      if (newPassword === confirm) break
      console.log('  Passwords do not match, try again.')
    }

    rl.close()
    console.log('\nUpdating password…')

    const { orm } = await initORM()
    const em = orm.em.fork()

    try {
      const user = await resetUserPassword(em, email, newPassword)
      await orm.close()
      console.log(`\n✓ Password updated for "${user.fullName}" <${email}>.`)
    } catch (err: any) {
      console.error(`\nError: ${err.message}`)
      await orm.close()
      process.exit(1)
    }
  }

  const command = process.argv[2]
  const handler =
    command === 'create-admin'
      ? runCreateAdmin
      : command === 'reset-password'
        ? runResetPassword
        : null

  if (!handler) {
    console.error(`\nUsage: fastify-admin <create-admin|reset-password>\n`)
    process.exit(1)
  }

  handler().catch((err) => {
    console.error('\nUnexpected error:', err.message ?? err)
    process.exit(1)
  })
}
