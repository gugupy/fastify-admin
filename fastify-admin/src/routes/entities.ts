import { EntityManager } from '@mikro-orm/core'
import { FastifyInstance } from 'fastify'
import { EntityRegistry } from '../registry.js'
import { EntityInterface } from '../entityInterface.js'

export async function registerEntityRoutes(
  app: FastifyInstance,
  em: EntityManager,
  registry: EntityRegistry,
) {
  for (const entity of registry.getAll()) {
    const base = `/api/${entity.name}`
    const iface = new EntityInterface(em, entity.entity)

    app.get(base, (req: any) => {
      // List columns come from the registry config — no request body needed.
      const listFields = entity.config.list?.columns
      const { page, limit } = req.query as { page?: string; limit?: string }
      if (page !== undefined) {
        const p = Math.max(1, parseInt(page) || 1)
        const l = Math.min(200, Math.max(1, parseInt(limit ?? '20') || 20))
        return iface.findPaginated(p, l, listFields)
      }
      return iface.findAll(listFields)
    })

    app.get(`${base}/:id`, (req: any) => {
      const opts: any = { populate: entity.relations }

      // Show fields come from the registry config — no request body needed.
      const showFields = entity.config.show?.fields

      // Build relation field specs so each relation only fetches its listColumns.
      // e.g. roles relation with listColumns ['id','name'] → 'roles.id', 'roles.name'
      const relationFields: string[] = entity.relations.flatMap((rel) => {
        const relEntity =
          registry.get(rel) ??
          registry.getAll().find((e) => `${e.name}s` === rel)
        const cols = relEntity?.config?.list?.columns
        if (cols?.length) return cols.map((c) => `${rel}.${c}`)
        return [] // no restriction — MikroORM will fetch all fields for this relation
      })

      if (showFields !== undefined) {
        // Strip bare relation names from scalar fields — relations are covered by relationFields.
        // relationFields adds e.g. 'roles.id', 'roles.name' so only listColumns are fetched.
        const scalarFields = showFields.filter(
          (v) => !entity.relations.includes(v),
        )
        opts.fields = [...scalarFields, ...relationFields]
      } else if (relationFields.length) {
        // No explicit field list but relations have column restrictions.
        // Enumerate entity scalar fields so MikroORM doesn't drop them.
        const scalarEntityFields = entity.fields
          .filter((f) => !entity.relations.includes(f.name))
          .map((f) => f.name)
        opts.fields = [...scalarEntityFields, ...relationFields]
      }

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
