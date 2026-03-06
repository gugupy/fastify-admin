/**
 * Development entry point for fastify-admin.
 *
 * Run with:
 *   pnpm --filter fastify-admin dev
 *
 * This boots a full Fastify server using the admin plugin directly from source,
 * so there is no separate `apps/api` needed. All backend code lives here.
 *
 * The frontend (apps/web) is served separately by Vite:
 *   pnpm --filter web dev
 * Vite proxies /api/* requests to this server on port 3001.
 */
import { fastify } from 'fastify'
import { MikroORM } from '@mikro-orm/postgresql'
import { createAdminPlugin } from './plugin.js'

const orm = await MikroORM.init()
await orm.migrator.up()

const app = fastify({ logger: { level: 'info' } })

await app.register(createAdminPlugin, {
  orm,
  name: process.env.ADMIN_NAME ?? 'FastifyAdmin',
  signup: process.env.SIGNUP_ENABLED !== 'false',
  resources: {
    user: {
      sidebar: false,
      icon: 'User03',
      list: { columns: ['id', 'username', 'fullName', 'email'] },
      show: { fields: ['id', 'username', 'fullName', 'email', 'roles'] },
      edit: { fields: ['username', 'fullName', 'roles'] },
      add: { fields: ['username', 'fullName', 'email', 'password', 'roles'] },
    },
    role: {
      sidebar: false,
      operations: ['list', 'show'],
      icon: 'ShieldUser',
      list: { columns: ['id', 'name'] },
      show: { fields: ['id', 'name', 'permissions'] },
    },
    permission: {
      sidebar: false,
      operations: ['list'],
      icon: 'LockKey',
      list: { columns: ['id', 'name'] },
    },
  },
})

const port = parseInt(process.env.PORT ?? '3001')
try {
  const url = await app.listen({ port, host: '0.0.0.0' })
  console.log(`Server started at ${url}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
