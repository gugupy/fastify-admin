import { useEffect, useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { renderField } from '../../../lib/entityFieldMapper'
import { entityRegistry, perm } from '../../../lib/entityRegistry'
import { useRbac } from '../../../lib/rbac'
import type { EntityMeta } from '../../../types/entity'
import { AdminIcon } from '../../../components/AdminIcon'
import { EntityTable } from '../../../components/EntityTable'

export const Route = createFileRoute('/$model/$id/show')({
  loader: async ({ params }) => {
    const [entitiesRes, recordRes] = await Promise.all([
      fetch('/api/entities'),
      fetch(`/api/${params.model}/${params.id}`),
    ])
    const entities: EntityMeta[] = await entitiesRes.json()
    const record: Record<string, unknown> = await recordRes.json()
    const entity = entities.find((e) => e.name === params.model)
    return { entity, entities, record }
  },
  component: ShowComponent,
})

function ShowComponent() {
  const { model, id } = Route.useParams()
  const { entity, entities, record } = Route.useLoaderData()
  const config = entityRegistry.get(model)
  const { can } = useRbac()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('details')

  // Reset to "details" tab when navigating to a different record or model.
  useEffect(() => {
    setActiveTab('details')
  }, [model, id])

  if (!entity) {
    return (
      <div className="p-6 text-destructive">Entity "{model}" not found.</div>
    )
  }

  if (config.show?.component) {
    const Custom = config.show.component
    return <Custom model={model} id={id} entity={entity} record={record} />
  }

  const showConfig = config.show ?? {}
  const allFields = entity.fields.filter((f) => f.name !== 'password')

  // Use showConfig.fields when configured; otherwise show all scalar fields
  // (relation fields are excluded to keep the details panel clean).
  const fields = showConfig.fields
    ? (showConfig.fields
        .map((name) => allFields.find((f) => f.name === name))
        .filter(Boolean) as typeof allFields)
    : allFields.filter((f) => !entity.relations.includes(f.name))

  // Relation tabs are only shown when relatedViews is explicitly configured.
  const explicitRelatedViews = showConfig.relatedViews

  const relationTabs = (explicitRelatedViews ?? [])
    .map((relatedModel) => {
      // Match the field by its entity type (e.g. type 'Role[]' → 'role').
      const field = entity.fields.find(
        (f) => f.type.replace('[]', '').toLowerCase() === relatedModel,
      )
      const relatedEntityMeta = entities.find((e) => e.name === relatedModel)
      // The field name (e.g. 'roles') may differ from the model name ('role'),
      // so use the field name to look up data in the API response.
      const fieldName = field?.name ?? relatedModel
      const records = Array.isArray(record[fieldName])
        ? (record[fieldName] as Record<string, unknown>[])
        : []
      return { relatedModel, field, relatedEntityMeta, records }
    })
    // Skip any relatedViews entry that has no matching field on this entity.
    .filter((tab) => tab.field !== undefined)

  const hasTabs = relationTabs.length > 0

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/$model/list" params={{ model }}>
            <button className="flex items-center gap-1 text-sm text-muted-foreground hover:underline uppercase">
              <AdminIcon name="arrowLeft" />
              <span>{model}</span>
            </button>
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-xl font-semibold">#{id}</h1>
        </div>
        {(() => {
          const p = perm(config, model, 'edit')
          return p !== false && can(p)
        })() && (
          <Link to="/$model/$id/edit" params={{ model, id }}>
            <button className="px-4 py-2 bg-foreground text-background text-sm">
              Edit
            </button>
          </Link>
        )}
      </div>

      {hasTabs && (
        <div className="flex gap-0 border-b mb-0">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'details'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Details
          </button>
          {relationTabs.map((tab) => (
            <button
              key={tab.relatedModel}
              onClick={() => setActiveTab(tab.relatedModel)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${
                activeTab === tab.relatedModel
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.relatedModel}
              {tab.records.length > 0 && (
                <span className="ml-2 text-xs bg-muted px-1.5 py-0.5">
                  {tab.records.length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'details' && (
        <div className="border divide-y">
          {fields.map((field) => (
            <div key={field.name} className="flex px-4 py-3 gap-4">
              <span className="w-40 shrink-0 text-xs text-muted-foreground uppercase font-medium pt-0.5">
                {field.name}
              </span>
              <div className="text-sm">
                {showConfig.renderField
                  ? showConfig.renderField(field, record[field.name], record)
                  : renderField(field, record[field.name], 'show')}
              </div>
            </div>
          ))}
        </div>
      )}

      {relationTabs.map((tab) => {
        if (activeTab !== tab.relatedModel) return null
        if (!tab.relatedEntityMeta) return null
        const relatedConfig = entityRegistry.get(tab.relatedModel)
        return (
          <div key={tab.relatedModel} className="pt-4">
            <EntityTable
              model={tab.relatedModel}
              entity={tab.relatedEntityMeta}
              records={tab.records}
              config={relatedConfig}
              onDeleted={() => router.invalidate()}
            />
          </div>
        )
      })}
    </div>
  )
}
