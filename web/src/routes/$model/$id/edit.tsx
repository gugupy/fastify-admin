import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { FieldInput, isEditableField } from '../../../lib/entityFieldMapper'
import { entityRegistry, perm } from '../../../lib/entityRegistry'
import { useRbac } from '../../../lib/rbac'
import { Label } from '@/components/ui/label'
import { RelationMultiSelect } from '../../../components/RelationMultiSelect'
import type { EntityMeta } from '../../../types/entity'
import { AdminIcon } from '../../../components/AdminIcon'

export const Route = createFileRoute('/$model/$id/edit')({
  loader: async ({ params }) => {
    const entitiesRes = await fetch('/api/entities')
    const entities: EntityMeta[] = await entitiesRes.json()
    const entity = entities.find((e) => e.name === params.model)
    const config = entityRegistry.get(params.model)
    // Ensure that if there are dotted field names like "roles.name",
    // we also include a top-level field for the relation (e.g. "roles")
    if (entity && Array.isArray(entity.fields)) {
      const dottedFields = entity.fields.filter(
        (f) => typeof f.name === 'string' && f.name.includes('.'),
      )
      for (const df of dottedFields) {
        const rootName = df.name.split('.')[0]
        if (!entity.fields.some((f) => f.name === rootName)) {
          // Add a minimal field entry for the relation root.
          // We set type to the rootName so relation handling (RelationMultiSelect)
          // can resolve the target entity by name.
          // Use `as any` to avoid depending on the exact Field type shape here.
          entity.fields.push({ name: rootName, type: rootName } as any)
        }
      }
    }

    let record: Record<string, unknown> = {}
    if (params.id !== 'new') {
      const recordRes = await fetch(`/api/${params.model}/show/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: config.edit?.fields }),
      })
      record = await recordRes.json()
    }

    return { entity, record }
  },
  component: EditComponent,
})

function EditComponent() {
  const { model, id } = Route.useParams()
  const { entity, record } = Route.useLoaderData()
  const navigate = useNavigate()
  const config = entityRegistry.get(model)
  const { can } = useRbac()
  const isNew = id === 'new'
  const requiredPerm = perm(config, model, isNew ? 'create' : 'edit')

  const [form, setForm] = useState<Record<string, unknown>>(record)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (requiredPerm === false || !can(requiredPerm)) {
    return (
      <div className="p-6 text-red-500">
        You don't have permission to {isNew ? 'create' : 'edit'} {model}{' '}
        records.
      </div>
    )
  }

  if (!entity) {
    return <div className="p-6 text-red-500">Entity "{model}" not found.</div>
  }

  if (config.edit?.component) {
    const Custom = config.edit.component
    return <Custom model={model} id={id} entity={entity} record={record} />
  }

  const editConfig = config.edit ?? {}
  const allEditable = entity.fields.filter(isEditableField)
  // If fields are explicitly listed, include them even if they're relations (not primitive)
  const editableFields = editConfig.fields
    ? (editConfig.fields
        .map((name) => entity.fields.find((f) => f.name === name))
        .filter(Boolean) as typeof allEditable)
    : allEditable

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await fetch(isNew ? `/api/${model}` : `/api/${model}/${id}`, {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    setSaving(false)

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.message ?? 'Something went wrong.')
      return
    }

    navigate({ to: '/$model/list', params: { model } })
  }

  function set(name: string, value: unknown) {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/$model/list" params={{ model }}>
          <button className="flex items-center gap-1 text-sm text-muted-foreground hover:underline uppercase">
            <AdminIcon name="arrowLeft" />
            <span>{model}</span>
          </button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-xl font-semibold">
          {isNew ? 'New' : `Edit #${id}`}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="border  divide-y">
        {editableFields.map((field) => (
          <div key={field.name} className="flex items-start px-4 py-3 gap-4">
            <Label className="w-40 shrink-0 pt-1.5 uppercase text-xs text-muted-foreground font-medium">
              {field.name}
            </Label>
            <div className="flex-1">
              {(() => {
                const val = form[field.name] ?? ''
                const onChg = (v: unknown) => set(field.name, v)
                const custom = editConfig.renderInput?.(field, val, onChg)
                if (custom) return custom
                // Auto-use RelationMultiSelect for non-primitive (relation) fields
                if (!isEditableField(field)) {
                  return (
                    <RelationMultiSelect
                      entityName={field.type.toLowerCase()}
                      value={val}
                      onChange={onChg}
                    />
                  )
                }
                return <FieldInput field={field} value={val} onChange={onChg} />
              })()}
            </div>
          </div>
        ))}

        {error && <div className="px-4 py-3 text-sm text-red-500">{error}</div>}

        <div className="flex justify-end gap-2 px-4 py-3">
          <Link to="/$model/list" params={{ model }}>
            <button type="button" className="px-4 py-2 border  text-sm">
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-foreground text-background text-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}
