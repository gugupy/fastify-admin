#!/usr/bin/env node
import { pathToFileURL, fileURLToPath } from 'url'
import { dirname, resolve, join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { spawnSync } from 'child_process'
import type { EntityManager } from '@mikro-orm/core'
import { User } from '../entities/user.entity.js'
import { Role } from '../entities/role.entity.js'
import { hashPassword } from '../lib/password.js'

// ── Load .env from cwd ────────────────────────────────────────────────────────

const envFile = join(process.cwd(), '.env')
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed
      .slice(idx + 1)
      .trim()
      .replace(/^["']|["']$/g, '')
    if (!(key in process.env)) process.env[key] = val
  }
}

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

// ── Detect user project config ────────────────────────────────────────────────

function findUserOrmConfig(): string | null {
  const candidates = [
    join(process.cwd(), 'mikro-orm.config.ts'),
    join(process.cwd(), 'mikro-orm.config.js'),
    join(process.cwd(), 'mikro-orm.config.mjs'),
  ]
  return candidates.find(existsSync) ?? null
}

// Migration commands cannot dynamically import mikro-orm.config.ts because this
// CLI runs as compiled JS and Node.js cannot execute TypeScript without a loader.
// Instead we delegate entirely to `mikro-orm-esm` (the official MikroORM CLI)
// as a child process — it handles TypeScript configs natively via ts-node,
// correctly discovers all entities, and uses the right migrations path.
function runMikroOrmCli(command: string, args: string[] = []): void {
  if (!findUserOrmConfig()) {
    console.error(`\nNo mikro-orm.config.ts found in ${process.cwd()}`)
    console.error('Run `fastify-admin init` to scaffold a new project first.\n')
    process.exit(1)
  }

  const result = spawnSync('npx', ['mikro-orm-esm', command, ...args], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true,
  })
  process.exit(result.status ?? 1)
}

// ── ORM init for CLI (create-admin / reset-password only) ─────────────────────
// These commands need direct ORM access to the user/role/permission tables.
// Builds config from env vars — works without a config file.

async function initCLIOrm() {
  const { MikroORM } = await import('@mikro-orm/postgresql')
  const { Migrator } = await import('@mikro-orm/migrations')

  const __dirname = dirname(fileURLToPath(import.meta.url))
  // dist/cli/index.js → dist/cli → dist
  const distDir = resolve(__dirname, '..')

  const dbConfig = process.env.DATABASE_URL
    ? { clientUrl: process.env.DATABASE_URL }
    : {
        dbName: process.env.DB_NAME ?? 'fastifyadmin',
        host: process.env.DB_HOST ?? 'localhost',
        port: parseInt(process.env.DB_PORT ?? '5432'),
        user: process.env.DB_USER ?? 'postgres',
        password: process.env.DB_PASSWORD ?? 'password',
      }

  return MikroORM.init({
    extensions: [Migrator],
    ...dbConfig,
    entities: [`${distDir}/**/*.entity.js`],
    migrations: {
      path: `${distDir}/migrations`,
    },
  })
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

  // ── create-admin ──────────────────────────────────────────────────────────────

  async function runCreateAdmin() {
    console.log('\nFastify Admin — Create Admin User')
    console.log('─'.repeat(34) + '\n')

    const orm = await initCLIOrm()
    const em = orm.em.fork()

    // Check Admin role exists before prompting — it is created by migrations.
    // If missing, the user needs to run `fastify-admin migrate:up` first.
    const adminRoleExists = await em.findOne(Role, { name: 'Admin' })
    if (!adminRoleExists) {
      await orm.close()
      rl.close()
      console.error('\nError: "Admin" role not found.')
      console.error(
        'Run `fastify-admin migrate:up` first to set up the database.\n',
      )
      process.exit(1)
    }

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

    const { user } = await createAdminUser(em, {
      fullName,
      username,
      email,
      password,
    })

    await orm.close()
    console.log(
      `\n✓ User "${user.fullName}" <${user.email}> created with Admin role.`,
    )
  }

  // ── reset-password ────────────────────────────────────────────────────────────

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

    const orm = await initCLIOrm()
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

  // ── migrate:up ────────────────────────────────────────────────────────────────

  async function runMigrateUp() {
    rl.close()
    runMikroOrmCli('migration:up')
  }

  // ── migrate:down ─────────────────────────────────────────────────────────────

  async function runMigrateDown() {
    rl.close()
    runMikroOrmCli('migration:down')
  }

  // ── migrate:create ────────────────────────────────────────────────────────────

  async function runMigrateCreate() {
    const name = process.argv[3]
    rl.close()
    runMikroOrmCli('migration:create', name ? ['--name', name] : [])
  }

  // ── schema:update ─────────────────────────────────────────────────────────────

  async function runSchemaUpdate() {
    rl.close()
    runMikroOrmCli('schema:update', ['--run'])
  }

  // ── init ──────────────────────────────────────────────────────────────────────

  async function runInit() {
    console.log('\nFastify Admin — New Project\n')

    // Prompt for app name
    let appName: string
    while (true) {
      appName = await ask('Project name: ')
      if (!appName) {
        console.log('  Please enter a project name.')
        continue
      }
      // kebab-case only
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(appName)) {
        console.log(
          '  Use lowercase letters, numbers, and hyphens only (e.g. my-app).',
        )
        continue
      }
      break
    }

    rl.close()

    const projectDir = join(process.cwd(), appName)

    if (existsSync(projectDir)) {
      console.error(`\n  Directory "${appName}" already exists. Aborting.\n`)
      process.exit(1)
    }

    mkdirSync(projectDir, { recursive: true })
    console.log(`\n  Creating project in ./${appName}/\n`)

    // helper to write a file and log it
    function write(relPath: string, content: string) {
      const full = join(projectDir, relPath)
      mkdirSync(dirname(full), { recursive: true })
      writeFileSync(full, content)
      console.log(`  ✓ ${relPath}`)
    }

    // .env
    write(
      '.env',
      [
        '# Database connection',
        '# Option A: full URL',
        `# DATABASE_URL=postgres://postgres:password@localhost:5432/${appName}`,
        '',
        '# Option B: individual vars',
        `DB_NAME=${appName}`,
        'DB_HOST=localhost',
        'DB_PORT=5432',
        'DB_USER=postgres',
        'DB_PASSWORD=password',
        '',
        '# App',
        'NODE_ENV=development',
        'PORT=3001',
        '',
        '# Auth',
        'JWT_SECRET=change-me-in-production',
        'APP_BASE_URL=http://localhost:3001',
      ].join('\n') + '\n',
    )

    // .gitignore
    write('.gitignore', ['node_modules', 'dist', '.env', ''].join('\n'))

    // mikro-orm.config.ts
    write(
      'mikro-orm.config.ts',
      [
        "import { defineConfig } from '@mikro-orm/postgresql'",
        "import { TsMorphMetadataProvider } from '@mikro-orm/reflection'",
        "import { Migrator } from '@mikro-orm/migrations'",
        "import { User, Role, Permission } from 'fastify-admin'",
        '',
        'export default defineConfig({',
        '  extensions: [Migrator],',
        '  ...(process.env.DATABASE_URL',
        '    ? { clientUrl: process.env.DATABASE_URL }',
        '    : {',
        `        dbName: process.env.DB_NAME ?? '${appName}',`,
        "        host: process.env.DB_HOST ?? 'localhost',",
        "        port: parseInt(process.env.DB_PORT ?? '5432'),",
        "        user: process.env.DB_USER ?? 'postgres',",
        "        password: process.env.DB_PASSWORD ?? 'password',",
        '      }),',
        '  entities: [User, Role, Permission],',
        "  entitiesTs: [User, Role, Permission, 'src/**/*.entity.ts'],",
        '  metadataProvider: TsMorphMetadataProvider,',
        '  migrations: {',
        "    path: 'dist/migrations',",
        "    pathTs: 'src/migrations',",
        '  },',
        '})',
        '',
      ].join('\n'),
    )

    // package.json
    write(
      'package.json',
      JSON.stringify(
        {
          name: appName,
          version: '0.1.0',
          type: 'module',
          scripts: {
            dev: 'node --env-file=.env --loader ts-node/esm src/index.ts',
            build: 'tsc',
            start: 'node dist/index.js',
          },
          dependencies: {
            fastify: 'latest',
            'fastify-plugin': 'latest',
            'fastify-admin': 'latest',
            '@fastify/cookie': 'latest',
            '@fastify/jwt': 'latest',
            '@fastify/static': 'latest',
            '@mikro-orm/cli': '6.6.8',
            '@mikro-orm/core': '6.6.8',
            '@mikro-orm/migrations': '6.6.8',
            '@mikro-orm/postgresql': '6.6.8',
            '@mikro-orm/reflection': '6.6.8',
            '@mikro-orm/seeder': '6.6.8',
          },
          devDependencies: {
            typescript: 'latest',
            'ts-node': 'latest',
            '@types/node': 'latest',
          },
        },
        null,
        2,
      ) + '\n',
    )

    // tsconfig.json
    write(
      'tsconfig.json',
      JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2022',
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            outDir: 'dist',
            strict: true,
            experimentalDecorators: true,
            emitDecoratorMetadata: true,
            esModuleInterop: true,
          },
          include: ['src', 'mikro-orm.config.ts'],
        },
        null,
        2,
      ) + '\n',
    )

    // src/entities/post.entity.ts
    write(
      'src/entities/post.entity.ts',
      [
        "import { Entity, PrimaryKey, Property } from '@mikro-orm/core'",
        '',
        '@Entity()',
        'export class Post {',
        '  @PrimaryKey()',
        '  id!: number',
        '',
        '  @Property()',
        '  title!: string',
        '',
        "  @Property({ type: 'text', nullable: true })",
        '  body?: string',
        '',
        '  @Property({ onCreate: () => new Date() })',
        '  createdAt: Date = new Date()',
        '}',
        '',
      ].join('\n'),
    )

    // src/views/post.view.ts
    write(
      'src/views/post.view.ts',
      [
        "import { EntityView } from 'fastify-admin'",
        '',
        'export class PostView extends EntityView {',
        "  label = 'Posts'",
        '',
        "  listColumns = ['id', 'title', 'createdAt']",
        "  showFields  = ['id', 'title', 'body', 'createdAt']",
        "  editFields  = ['title', 'body']",
        "  addFields   = ['title', 'body']",
        '}',
        '',
      ].join('\n'),
    )

    // src/index.ts
    const label = appName
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
    write(
      'src/index.ts',
      [
        "import Fastify from 'fastify'",
        "import { MikroORM } from '@mikro-orm/postgresql'",
        "import { fastifyAdmin } from 'fastify-admin'",
        "import config from '../mikro-orm.config.js'",
        "import { PostView } from './views/post.view.js'",
        '',
        'const orm = await MikroORM.init(config)',
        '',
        '// Sync your entity tables in development',
        "if (process.env.NODE_ENV !== 'production') {",
        '  await orm.schema.updateSchema()',
        '}',
        '',
        'const app = Fastify({ logger: true })',
        '',
        'await app.register(fastifyAdmin, {',
        '  orm,',
        `  name: '${label}',`,
        '  views: {',
        '    post: new PostView(),',
        '  },',
        '})',
        '',
        "const port = parseInt(process.env.PORT ?? '3001')",
        "await app.listen({ port, host: '0.0.0.0' })",
        'console.log(`Admin UI → http://localhost:${port}`)',
        '',
      ].join('\n'),
    )

    console.log(`\nProject created! Next steps:\n`)
    console.log(`  cd ${appName}`)
    console.log(`  npm install`)
    console.log(`  # Edit .env with your database credentials`)
    console.log(`  npx fastify-admin migrate:up`)
    console.log(`  npx fastify-admin create-admin`)
    console.log(`  npm run dev\n`)
  }

  // ── generate:resource ─────────────────────────────────────────────────────────

  async function runGenerateResource() {
    const name = process.argv[3]
    rl.close()

    if (!name) {
      console.error('\nUsage: fastify-admin generate:resource <Name>')
      console.error('Example: fastify-admin generate:resource Product\n')
      process.exit(1)
    }

    // Normalise: PascalCase name, lowercase slug
    const pascal = name.charAt(0).toUpperCase() + name.slice(1)
    const slug = name.toLowerCase()

    const cwd = process.cwd()
    const entitiesDir = join(cwd, 'src', 'entities')
    const viewsDir = join(cwd, 'src', 'views')
    mkdirSync(entitiesDir, { recursive: true })
    mkdirSync(viewsDir, { recursive: true })

    console.log(`\nFastify Admin — Generating resource: ${pascal}\n`)

    // Entity file
    const entityPath = join(entitiesDir, `${slug}.entity.ts`)
    if (existsSync(entityPath)) {
      console.log(`  src/entities/${slug}.entity.ts already exists, skipping.`)
    } else {
      writeFileSync(
        entityPath,
        [
          "import { Entity, PrimaryKey, Property } from '@mikro-orm/core'",
          '',
          '@Entity()',
          `export class ${pascal} {`,
          '  @PrimaryKey()',
          '  id!: number',
          '',
          '  @Property()',
          '  name!: string',
          '',
          '  @Property({ onCreate: () => new Date() })',
          '  createdAt: Date = new Date()',
          '}',
          '',
        ].join('\n'),
      )
      console.log(`  ✓ Created src/entities/${slug}.entity.ts`)
    }

    // View file
    const viewPath = join(viewsDir, `${slug}.view.ts`)
    if (existsSync(viewPath)) {
      console.log(`  src/views/${slug}.view.ts already exists, skipping.`)
    } else {
      writeFileSync(
        viewPath,
        [
          "import { EntityView } from 'fastify-admin'",
          '',
          `export class ${pascal}View extends EntityView {`,
          `  label = '${pascal}s'`,
          '',
          "  listColumns = ['id', 'name', 'createdAt']",
          "  showFields  = ['id', 'name', 'createdAt']",
          "  editFields  = ['name']",
          "  addFields   = ['name']",
          '}',
          '',
        ].join('\n'),
      )
      console.log(`  ✓ Created src/views/${slug}.view.ts`)
    }

    console.log('\nRegister the view in your server:')
    console.log(`  import { ${pascal}View } from './views/${slug}.view.js'`)
    console.log(`  // in fastifyAdmin options:`)
    console.log(`  views: { ${slug}: new ${pascal}View() }\n`)
  }

  // ── Dispatch ──────────────────────────────────────────────────────────────────

  const command = process.argv[2]

  const commands: Record<string, () => Promise<void>> = {
    init: runInit,
    'generate:resource': runGenerateResource,
    'create-admin': runCreateAdmin,
    'reset-password': runResetPassword,
    'migrate:up': runMigrateUp,
    'migrate:down': runMigrateDown,
    'migrate:create': runMigrateCreate,
    'schema:update': runSchemaUpdate,
  }

  const handler = commands[command]

  if (!handler) {
    rl.close()
    console.error(`
Usage: fastify-admin <command>

Commands:
  init                        Scaffold .env, mikro-orm.config.ts, and example files
  generate:resource <Name>    Scaffold an entity + EntityView for a new resource
  create-admin                Create a new admin user (interactive)
  reset-password              Reset a user's password (interactive)
  migrate:up                  Apply all pending migrations
  migrate:down                Roll back the last migration
  migrate:create [name]       Create a new migration file
  schema:update               Sync schema without migrations (dev only)
`)
    process.exit(1)
  }

  handler().catch((err) => {
    console.error('\nUnexpected error:', err.message ?? err)
    process.exit(1)
  })
}
