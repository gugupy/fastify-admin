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
import { fastifyAdmin } from './plugin.js'
import { views } from './views/index.js'

const orm = await MikroORM.init()
await orm.migrator.up()

const app = fastify({ logger: { level: 'info' } })

await app.register(fastifyAdmin, {
  orm,
  requireEmailVerification: false,
  views,
})

const port = parseInt(process.env.ADMIN_PORT ?? '3001')
try {
  const url = await app.listen({ port, host: '0.0.0.0' })
  console.log(`Server started at ${url}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
