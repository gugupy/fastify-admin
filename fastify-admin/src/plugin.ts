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
import { ViewRegistry } from './ViewRegistry.js'
import {
  registerAuthRoutes,
  registerOAuthRoutes,
  requireAuth,
} from './routes/auth.js'
import { registerEntityRoutes } from './routes/entities.js'
import { seedRbac } from './seedRbac.js'
import type { FastifyAdminOptions, AdminConfig } from './types.js'

function normalizeFields(fields: string[]): string[] {
  const extra: string[] = []
  for (const v of fields) {
    if (v.includes('.')) {
      const root = v.split('.')[0]
      if (!fields.includes(root)) extra.push(root)
    }
  }
  return [...new Set([...fields, ...extra])]
}

const __dirname = dirname(fileURLToPath(import.meta.url))

const fastifyAdmin: FastifyPluginAsync<FastifyAdminOptions> = async (
  app,
  options,
) => {
  const {
    orm,
    name = process.env.ADMIN_NAME ?? 'Fastify Admin',
    signup = process.env.ADMIN_SIGNUP_ENABLED === 'true',
    requireEmailVerification = process.env.ADMIN_EMAIL_VERIFICATION === 'true',
    mfaEnabled = process.env.ADMIN_MFA_ENABLED === 'true',
    views = {},
    securityEntities = ['user', 'role', 'permission'],
    appBaseUrl = process.env.ADMIN_BASE_URL ?? 'http://localhost:3001',
  } = options

  // ── Plugins ──────────────────────────────────────────────────────────────

  await app.register(fastifyCookie)
  await app.register(fastifyJwt, {
    secret: process.env.ADMIN_JWT_SECRET ?? 'change-me-in-production',
    cookie: { cookieName: 'token', signed: false },
  })

  // ── Entity registry ───────────────────────────────────────────────────────

  const registry = new EntityRegistry()

  // Security entities are hidden from main nav but accessible via RBAC
  for (const entityName of securityEntities) {
    registry.setConfig(entityName, { sidebar: false })
  }

  // Apply user-provided entity views
  const viewEntries =
    views instanceof ViewRegistry ? views.entries() : Object.entries(views)

  for (const [entityName, view] of viewEntries) {
    registry.setConfig(entityName, view)
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

  await seedRbac(orm.em, registry, securityEntities)

  // ── Auth routes (public) ──────────────────────────────────────────────────

  await registerAuthRoutes(app, orm.em, {
    signup,
    requireEmailVerification,
    mfaEnabled,
  })
  await registerOAuthRoutes(app, orm.em, appBaseUrl)

  // ── Admin config endpoint ─────────────────────────────────────────────────

  app.get('/api/admin-config', async (_req, reply) => {
    const entities: AdminConfig['entities'] = {}
    for (const entity of registry.getAll()) {
      const { edit, add, show, list } = entity.config
      if (edit?.fields) edit.fields = normalizeFields(edit.fields)
      if (add?.fields) add.fields = normalizeFields(add.fields)
      if (show?.fields) show.fields = normalizeFields(show.fields)
      if (list?.columns) list.columns = normalizeFields(list.columns)
      entities[entity.name] = entity.config
    }
    const config: AdminConfig = {
      name,
      signup,
      requireEmailVerification,
      mfaEnabled,
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
