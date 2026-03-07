import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import { RequestContext } from '@mikro-orm/core'
import fastifyCookie from '@fastify/cookie'
import fastifyJwt from '@fastify/jwt'
import fastifyStatic from '@fastify/static'
import fp from 'fastify-plugin'
import type { FastifyPluginAsync } from 'fastify'
import { EntityRegistry } from './registry.js'
import {
  registerAuthRoutes,
  registerOAuthRoutes,
  requireAuth,
} from './routes/auth.js'
import { registerEntityRoutes } from './routes/entities.js'
import { seedRbac } from './seedRbac.js'
import type { FastifyAdminOptions, AdminConfig } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const fastifyAdmin: FastifyPluginAsync<FastifyAdminOptions> = async (
  app,
  options,
) => {
  const {
    orm,
    name = 'Fastify Admin',
    signup = true,
    requireEmailVerification = false,
    emailEnabled = false,
    resources = {},
    securityEntities = ['user', 'role', 'permission'],
    appBaseUrl = process.env.APP_BASE_URL ?? 'http://localhost:3001',
  } = options

  // ── Plugins ──────────────────────────────────────────────────────────────

  await app.register(fastifyCookie)
  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET ?? 'change-me-in-production',
    cookie: { cookieName: 'token', signed: false },
  })

  // ── Entity registry ───────────────────────────────────────────────────────

  const registry = new EntityRegistry()

  // Security entities are hidden from main nav but accessible via RBAC
  for (const name of securityEntities) {
    registry.setConfig(name, { sidebar: false })
  }

  // Apply user-provided resource configs
  for (const [entityName, resource] of Object.entries(resources)) {
    registry.setConfig(entityName, resource)
  }

  registry.autoRegister(orm)

  // ── Hooks ─────────────────────────────────────────────────────────────────

  app.addHook('onRequest', (_request, _reply, done) => {
    RequestContext.create(orm.em, done)
  })

  app.addHook('onClose', async () => {
    await orm.close()
  })

  // ── Static UI ─────────────────────────────────────────────────────────────

  // Serve the pre-built web UI bundled with the package.
  // Falls back gracefully if the `ui/` directory isn't present (e.g. during development).
  const uiDir = resolve(__dirname, '../ui')
  if (existsSync(uiDir)) {
    await app.register(fastifyStatic, { root: uiDir, prefix: '/' })
    app.setNotFoundHandler((_request, reply) => {
      reply.sendFile('index.html')
    })
  }

  // ── RBAC seeding ──────────────────────────────────────────────────────────

  await seedRbac(orm.em, registry)

  // ── Auth routes (public) ──────────────────────────────────────────────────

  await registerAuthRoutes(app, orm.em, { signup, requireEmailVerification, emailEnabled })
  await registerOAuthRoutes(app, orm.em, appBaseUrl)

  // ── Admin config endpoint ─────────────────────────────────────────────────

  app.get('/api/admin-config', async (_req, reply) => {
    const entities: AdminConfig['entities'] = {}
    for (const entity of registry.getAll()) {
      entities[entity.name] = entity.config
    }
    const config: AdminConfig = {
      name,
      signup,
      requireEmailVerification,
      emailEnabled,
      securityEntities,
      oauth: {
        google: !!(
          process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ),
        github: !!(
          process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
        ),
        microsoft: !!(
          process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET
        ),
      },
      entities,
    }
    reply.send(config)
  })

  // ── Auth guard for all /api routes except /api/auth/* ────────────────────

  app.addHook('preHandler', async (req, reply) => {
    if (
      req.routeOptions.url?.startsWith('/api/') &&
      !req.routeOptions.url?.startsWith('/api/auth/') &&
      req.routeOptions.url !== '/api/admin-config'
    ) {
      await requireAuth(req, reply)
    }
  })

  // ── Entity CRUD routes ────────────────────────────────────────────────────

  app.get('/api/entities', async (_request, reply) => {
    reply.send(registry.getAll().map(({ name, fields }) => ({ name, fields })))
  })

  app.get('/api/dashboard', async (_request, reply) => {
    const counts = await Promise.all(
      registry.getAll().map(async (entity) => {
        const count = await orm.em.count(entity.entity)
        return { name: entity.name, count }
      }),
    )
    reply.send(counts)
  })

  await registerEntityRoutes(app, orm.em, registry)
}

export default fp(fastifyAdmin, {
  name: 'fastify-admin',
  fastify: '5.x',
})

export { fastifyAdmin }
