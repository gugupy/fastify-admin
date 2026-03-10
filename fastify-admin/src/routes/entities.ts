import { EntityManager } from '@mikro-orm/core'
import { FastifyInstance } from 'fastify'
import { EntityRegistry } from '../registry.js'
import { EntityInterface } from '../entityInterface.js'
import { InternalEntity } from '../types.js'

export async function registerEntityRoutes(
  app: FastifyInstance,
  em: EntityManager,
  registry: EntityRegistry,
) {
  for (const entity of registry.getAll()) {
    const base = `/api/${entity.name}`
    const iface = new EntityInterface(em, entity.entity)

    app.post(`${base}/list`, (req: any) => {
      const { fields } = req.body as { fields?: string[] }
      const { page, limit } = req.query as { page?: string; limit?: string }
      if (page !== undefined) {
        const p = Math.max(1, parseInt(page) || 1)
        const l = Math.min(200, Math.max(1, parseInt(limit ?? '20') || 20))
        return iface.findPaginated(p, l, fields)
      }
      return iface.findAll(fields)
    })
    app.post(`${base}/show/:id`, (req: any) => {
      const { fields } = req.body as { fields?: string[] }
      const opts: any = { populate: entity.relations }
      if (fields !== undefined) {
        opts.fields = fields.filter((v) => !entity.relations.includes(v))
      }
      globalThis.console.log('Options', opts)
      return iface.findById(req.params.id, opts)
    })
    app.post(`${base}/create`, (req: any) => iface.create(req.body))
    app.put(`${base}/:id`, (req: any) => iface.update(req.params.id, req.body))
    app.delete(`${base}/:id`, async (req: any) => {
      const deleted = await iface.delete(req.params.id)
      return { success: deleted }
    })
  }
}
