import { createFileRoute, Link } from '@tanstack/react-router'
import { renderField } from '../../../lib/entityFieldMapper'
import {
  entityRegistry,
  perm,
  ALL_OPERATIONS,
} from '../../../lib/entityRegistry'
import { useRbac } from '../../../lib/rbac'
import type { EntityMeta } from '../../../types/entity'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'

export const Route = createFileRoute('/$model/$id/show')({
  loader: async ({ params }) => {
    const [entitiesRes, recordRes] = await Promise.all([
      fetch('/api/entities'),
      fetch(`/api/${params.model}/${params.id}`),
    ])
    const entities: EntityMeta[] = await entitiesRes.json()
    const record: Record<string, unknown> = await recordRes.json()
    const entity = entities.find((e) => e.name === params.model)
    return { entity, record }
  },
  component: ShowComponent,
})

function ShowComponent() {
  const { model, id } = Route.useParams()
  const { entity, record } = Route.useLoaderData()
  const config = entityRegistry.get(model)
  const { can } = useRbac()

  if (!entity) {
    return <div className="p-6 text-red-500">Entity "{model}" not found.</div>
  }

  if (config.show?.component) {
    const Custom = config.show.component
    return <Custom model={model} id={id} entity={entity} record={record} />
  }

  const showConfig = config.show ?? {}
  const allFields = entity.fields.filter((f) => f.name !== 'password')
  const fields = showConfig.fields
    ? (showConfig.fields
        .map((name) => allFields.find((f) => f.name === name))
        .filter(Boolean) as typeof allFields)
    : allFields

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/$model/list" params={{ model }}>
            <button className="flex items-center gap-1 text-sm text-muted-foreground hover:underline uppercase">
              <HugeiconsIcon icon={ArrowLeft01Icon} />
              <span>{model}</span>
            </button>
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-xl font-semibold">#{id}</h1>
        </div>
        {new Set(config.operations ?? ALL_OPERATIONS).has('edit') &&
          can(perm(config, model, 'edit')) && (
            <Link to="/$model/$id/edit" params={{ model, id }}>
              <button className="px-4 py-2 bg-foreground text-background text-sm">
                Edit
              </button>
            </Link>
          )}
      </div>

      <div className="border  divide-y">
        {fields.map((field) => (
          <div key={field.name} className="flex px-4 py-3 gap-4">
            <span className="w-40 shrink-0 text-xs text-muted-foreground uppercase font-medium pt-0.5">
              {field.name}
            </span>
            <div className="text-sm">
              {showConfig.renderField
                ? showConfig.renderField(field, record[field.name], record)
                : renderField(field, record[field.name])}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
