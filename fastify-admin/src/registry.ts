import type { MikroORM } from '@mikro-orm/core'
import type { InternalEntity, EntityConfig } from './types.js'
import type { AdminResource } from './AdminResource.js'

export class EntityRegistry {
  private entities: InternalEntity[] = []
  private configs: Map<string, EntityConfig> = new Map()

  /**
   * Walk the ORM metadata and auto-register every non-pivot entity.
   * Must be called after `orm.init()`.
   */
  autoRegister(orm: MikroORM) {
    const metadata = orm.getMetadata().getAll()
    for (const meta of Object.values(metadata)) {
      if (meta.pivotTable) continue
      const fields = Object.values(meta.properties).map((prop) => ({
        name: prop.name,
        type: prop.type,
      }))
      const config = this.configs.get(meta.collection) ?? {}
      this.entities.push({
        name: meta.collection,
        entity: meta.class as any,
        config,
        fields,
      })
    }
  }

  /**
   * Register a resource config for a named entity.
   * Call before `autoRegister` so the config is merged in.
   */
  setConfig(name: string, resource: EntityConfig | AdminResource) {
    const config = 'toConfig' in resource ? resource.toConfig() : resource
    const existing = this.configs.get(name) ?? {}
    this.configs.set(name, { ...existing, ...config })
  }

  getAll(): InternalEntity[] {
    return this.entities
  }

  get(name: string): InternalEntity | undefined {
    return this.entities.find((e) => e.name === name)
  }
}
