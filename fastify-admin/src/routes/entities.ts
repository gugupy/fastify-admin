import { EntityManager } from '@mikro-orm/core'
import { FastifyInstance } from 'fastify'
import { EntityRegistry } from '../registry.js'
import { EntityInterface } from '../entityInterface.js'
import { findFields } from '../lib/helpers.js'

/**
 * Registers CRUD routes for every entity in the registry.
 *
 * Routes per entity (base = /api/{model}):
 *   GET    /api/{model}          — paginated list   (?page=1&limit=20)
 *   GET    /api/{model}/:id      — single record with relations
 *   POST   /api/{model}/create   — create a record
 *   PUT    /api/{model}/:id      — update a record
 *   DELETE /api/{model}/:id      — delete a record
 *
 * Field selection and page size are resolved from the server-side registry
 * config (EntityView) so no request body is required for read operations.
 */
export async function registerEntityRoutes(
  app: FastifyInstance,
  em: EntityManager,
  registry: EntityRegistry,
) {
  for (const entity of registry.getAll()) {
    const base = `/api/${entity.name}`
    const iface = new EntityInterface(em, entity.entity)

    // ── List ────────────────────────────────────────────────────────────────
    // Returns all records or a paginated slice when ?page is provided.
    // Field selection priority:
    //   1. listColumns configured → use them directly.
    //   2. No listColumns → use all scalar (non-relation) fields so that
    //      relation arrays are not loaded unnecessarily in list views.
    app.get(base, (req: any) => {
      const listFields = findFields(entity, 'list')
      const { page, limit } = req.query as { page?: string; limit?: string }
      if (page !== undefined) {
        const p = Math.max(1, parseInt(page) || 1)
        const l = Math.min(200, Math.max(1, parseInt(limit ?? '20') || 20))
        return iface.findPaginated(p, l, listFields)
      }
      return iface.findAll(listFields)
    })

    // ── Show ────────────────────────────────────────────────────────────────
    // Returns a single record with its configured relations populated.
    // Relations are only loaded when explicitly referenced — either via a
    // dotted path in showFields (e.g. 'roles.name') or listed in relatedViews.
    // This prevents large relation arrays (e.g. all users on a role) from
    // being loaded when they aren't needed by the show page.
    //
    // Field selection is built in two layers:
    //   1. Scalar fields — from showFields config, or all scalar entity fields.
    //   2. Relation fields — from each referenced relation's listColumns config,
    //      e.g. ['roles.id', 'roles.name']. Falls back to the bare relation
    //      name (e.g. 'roles') to include all relation fields when no
    //      listColumns are configured for that relation.
    // Both layers are merged into opts.fields so MikroORM fetches exactly
    // what is needed and nothing is accidentally dropped.
    app.get(`${base}/:id`, (req: any) => {
      const showFields = entity.config.show?.fields
      const relatedViews: string[] = entity.config.show?.relatedViews ?? []

      // Determine which relations are actually needed:
      //   - Relations referenced via dotted paths in showFields (e.g. 'roles.name' → 'roles')
      //   - Relations listed in relatedViews
      const showFieldRelations = (showFields ?? [])
        .filter((f) => f.includes('.'))
        .map((f) => f.split('.')[0])
      const activeRelations = [
        ...new Set([...showFieldRelations, ...relatedViews]),
      ].filter((r) => entity.relations.includes(r))

      const opts: any = { populate: activeRelations }

      const relationFields: string[] = activeRelations.flatMap((rel) => {
        // Look up the related entity by its collection name, with a fallback
        // for plural relation names (e.g. 'roles' → entity named 'role').
        const relEntity =
          registry.get(rel) ??
          registry.getAll().find((e) => `${e.name}s` === rel)
        const cols = relEntity?.config?.list?.columns
        // Restrict to listColumns when configured; otherwise include all fields.
        if (cols?.length) return cols.map((c) => `${rel}.${c}`)
        return [rel]
      })

      if (showFields !== undefined) {
        // Explicit show fields configured — strip bare relation names since
        // those are already represented in relationFields with proper specs.
        const scalarFields = showFields.filter(
          (v) => !entity.relations.includes(v) && !v.includes('.'),
        )
        opts.fields = [...scalarFields, ...relationFields]
      } else if (activeRelations.length) {
        // No explicit show fields — enumerate all scalar fields manually so
        // MikroORM doesn't drop them when opts.fields is set for relations.
        const scalarEntityFields = entity.fields
          .filter((f) => !entity.relations.includes(f.name))
          .map((f) => f.name)
        opts.fields = [...scalarEntityFields, ...relationFields]
      }

      return iface.findById(req.params.id, opts)
    })

    // ── Create / Update / Delete ────────────────────────────────────────────
    app.post(`${base}/create`, (req: any) => iface.create(req.body))
    app.put(`${base}/:id`, (req: any) => iface.update(req.params.id, req.body))
    app.delete(`${base}/:id`, async (req: any) => {
      const deleted = await iface.delete(req.params.id)
      return { success: deleted }
    })
  }
}
