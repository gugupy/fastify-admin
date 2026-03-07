import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Field } from '../types/entity'

export { PRIMITIVE_TYPES, isEditableField } from './entityFieldUtils'

type InputProps = {
  field: Field
  value: unknown
  onChange: (v: unknown) => void
}

export function FieldInput({ field, value, onChange }: InputProps) {
  const str = value === null || value === undefined ? '' : String(value)

  if (field.type === 'text') {
    return <Textarea value={str} onChange={(e) => onChange(e.target.value)} />
  }
  if (field.type === 'boolean') {
    return (
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
      />
    )
  }
  if (['number', 'integer', 'float', 'double'].includes(field.type)) {
    return (
      <Input
        type="number"
        value={str}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }
  if (field.type === 'date' || field.type === 'Date') {
    return (
      <Input
        type="date"
        value={str}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }
  if (field.type === 'datetime') {
    return (
      <Input
        type="datetime-local"
        value={str}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }
  return (
    <Input type="text" value={str} onChange={(e) => onChange(e.target.value)} />
  )
}

type CellRenderer = (value: unknown) => React.ReactNode

const renderers: Record<string, CellRenderer> = {
  string: (v) => <span>{String(v ?? '')}</span>,
  text: (v) => (
    <span className="max-w-xs truncate block">{String(v ?? '')}</span>
  ),
  number: (v) => (
    <span className="font-mono tabular-nums">{String(v ?? '')}</span>
  ),
  integer: (v) => (
    <span className="font-mono tabular-nums">{String(v ?? '')}</span>
  ),
  float: (v) => (
    <span className="font-mono tabular-nums">{String(v ?? '')}</span>
  ),
  double: (v) => (
    <span className="font-mono tabular-nums">{String(v ?? '')}</span>
  ),
  boolean: (v) => <span>{v ? 'Yes' : 'No'}</span>,
  date: (v) => (
    <span>{v ? new Date(String(v)).toLocaleDateString() : '—'}</span>
  ),
  datetime: (v) => (
    <span>{v ? new Date(String(v)).toLocaleString() : '—'}</span>
  ),
  Date: (v) => (
    <span>{v ? new Date(String(v)).toLocaleDateString() : '—'}</span>
  ),
  enum: (v) => <span className="capitalize">{String(v ?? '')}</span>,
  json: (v) => <code className="text-xs">{JSON.stringify(v)}</code>,
  jsonb: (v) => <code className="text-xs">{JSON.stringify(v)}</code>,
}

const fallback: CellRenderer = (v) => {
  if (v === null || v === undefined)
    return <span className="text-muted-foreground">—</span>
  if (typeof v === 'object')
    return <code className="text-xs">{JSON.stringify(v)}</code>
  return <span>{String(v)}</span>
}

export function renderField(field: Field, value: unknown): React.ReactNode {
  if (Array.isArray(value)) {
    if (value.length === 0)
      return <span className="text-muted-foreground">—</span>
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((item, i) => (
          <span key={i} className="px-2 py-0.5 text-xs bg-muted border">
            {typeof item === 'object' && item !== null
              ? ((item as any).name ?? (item as any).id ?? JSON.stringify(item))
              : String(item)}
          </span>
        ))}
      </div>
    )
  }
  return (renderers[field.type] ?? fallback)(value)
}
