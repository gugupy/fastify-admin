import type { Field } from '../types/entity'

export const PRIMITIVE_TYPES = new Set([
  'string',
  'text',
  'number',
  'integer',
  'float',
  'double',
  'boolean',
  'date',
  'datetime',
  'Date',
  'enum',
])

export function isEditableField(field: Field): boolean {
  return field.name !== 'id' && PRIMITIVE_TYPES.has(field.type)
}
