import { InternalEntity } from '../types.js'

function findFields(entity: InternalEntity, operation: string): string[] {
  const entityFields = entity.fields
  const entityRelations = entity.relations

  if (operation === 'list') {
    const configuredColumns = entity.config.list?.columns

    const fields = configuredColumns?.length
      ? configuredColumns
      : entityFields
          .filter((f) => !entityRelations.includes(f.name))
          .map((f) => f.name)

    return fields
  } else {
    return entityFields.map((f) => f.name)
  }
}

export { findFields }
