import Fastify from 'fastify'
import { MikroORM } from '@mikro-orm/postgresql'
import { TsMorphMetadataProvider } from '@mikro-orm/reflection'
import { User, Role, Permission } from '../index.js'
import { fastifyAdmin } from '../plugin.js'

export async function buildApp(
  opts: {
    requireEmailVerification?: boolean
    mfaEnabled?: boolean
    views?: Record<string, any>
  } = {},
) {
  const orm = await MikroORM.init({
    entities: [User, Role, Permission],
    dbName: process.env.TEST_DB_NAME ?? 'fastifyadmin_test',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432'),
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'password',
    metadataProvider: TsMorphMetadataProvider,
  })

  await orm.schema.refreshDatabase()

  const app = Fastify()

  await app.register(fastifyAdmin, {
    orm,
    name: 'Test Admin',
    signup: true,
    requireEmailVerification: opts.requireEmailVerification ?? false,
    mfaEnabled: opts.mfaEnabled ?? false,
    views: opts.views ?? {},
  })

  await app.ready()

  return { app, orm }
}

export async function teardown(ctx: Awaited<ReturnType<typeof buildApp>>) {
  await ctx.app.close()
}
