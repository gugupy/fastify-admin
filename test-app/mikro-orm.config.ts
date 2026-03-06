import { defineConfig } from '@mikro-orm/postgresql'
import { TsMorphMetadataProvider } from '@mikro-orm/reflection'
import { User, Role, Permission } from 'fastify-admin'

export default defineConfig({
  dbName: process.env.DB_NAME ?? 'fastifyadmin_test',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432'),
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'password',
  entities: [User, Role, Permission, 'dist/**/*.entity.js'],
  entitiesTs: [User, Role, Permission, 'src/**/*.entity.ts'],
  metadataProvider: TsMorphMetadataProvider,
  debug: true,
})
