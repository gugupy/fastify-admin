import Fastify from 'fastify'
import { MikroORM } from '@mikro-orm/postgresql'
import { fastifyAdmin, AdminResource } from 'fastify-admin'
import config from '../mikro-orm.config.js'

class ProductResource extends AdminResource {
  label = 'Products'
  listColumns() {
    return ['id', 'name', 'price', 'createdAt']
  }
  showFields() {
    return ['id', 'name', 'price', 'description', 'createdAt']
  }
  editFields() {
    return ['name', 'price', 'description']
  }
  addFields() {
    return ['name', 'price', 'description']
  }
}

const orm = await MikroORM.init(config)

await orm.schema.updateSchema()

const app = Fastify({ logger: true })

await app.register(fastifyAdmin, {
  orm,
  name: 'Test Admin',
  signup: true,
  resources: {
    product: new ProductResource(),
  },
})

const port = parseInt(process.env.PORT ?? '3001')
await app.listen({ port, host: '0.0.0.0' })
console.log(`Admin UI → http://localhost:${port}`)
