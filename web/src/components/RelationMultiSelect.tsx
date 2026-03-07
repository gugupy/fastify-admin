import { useEffect, useState } from 'react'
import {
  Combobox,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxEmpty,
  useComboboxAnchor,
} from '@/components/ui/combobox'

type RelatedItem = Record<string, unknown> & { id: number }

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Derive a human-readable label from an item — uses `name` if present, else first string field, else `id`. */
function getLabel(item: RelatedItem): string {
  if (typeof item.name === 'string') return item.name
  const first = Object.values(item).find((v) => typeof v === 'string')
  return first ? String(first) : String(item.id)
}

/**
 * Generic multi-select for any ManyToMany relation.
 * Fetches options from `/api/{entityName}` (derived by lowercasing `field.type`).
 */
export function RelationMultiSelect({
  entityName,
  value,
  onChange,
}: {
  /** Lowercase entity name used to build the fetch URL (e.g. "permission"). */
  entityName: string
  value: unknown
  onChange: (v: unknown) => void
}) {
  const [all, setAll] = useState<RelatedItem[]>([])
  const anchor = useComboboxAnchor()

  useEffect(() => {
    fetch(`/api/${entityName}`)
      .then((r) => r.json())
      .then(setAll)
      .catch(() => {})
  }, [entityName])

  // Normalize incoming value (populated objects or plain IDs) → string IDs for Combobox
  const selectedIds: string[] = Array.isArray(value)
    ? value.map((v: any) => String(typeof v === 'object' ? v.id : v))
    : []

  // Group items by the prefix before the first dot (e.g. "user.list" → "user"), else "general"
  const groups: Record<string, RelatedItem[]> = {}
  for (const item of all) {
    const label = getLabel(item)
    const prefix = label.includes('.') ? label.split('.')[0] : entityName
    ;(groups[prefix] ??= []).push(item)
  }

  function handleChange(newIds: string[]) {
    onChange(newIds.map(Number))
  }

  return (
    <Combobox multiple value={selectedIds} onValueChange={handleChange}>
      <ComboboxChips ref={anchor} className="w-full -md min-h-9">
        {selectedIds.map((id) => {
          const item = all.find((p) => String(p.id) === id)
          return (
            <ComboboxChip key={id} value={id}>
              {item ? getLabel(item) : id}
            </ComboboxChip>
          )
        })}
        <ComboboxChipsInput
          placeholder={selectedIds.length === 0 ? `Search ${entityName}s…` : ''}
        />
      </ComboboxChips>

      <ComboboxContent anchor={anchor}>
        <ComboboxList>
          <ComboboxEmpty>No {entityName}s found</ComboboxEmpty>
          {Object.entries(groups).map(([group, items]) => (
            <ComboboxGroup key={group}>
              <ComboboxLabel>{capitalize(group)}</ComboboxLabel>
              {items.map((item) => (
                <ComboboxItem key={item.id} value={String(item.id)}>
                  {getLabel(item)}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
