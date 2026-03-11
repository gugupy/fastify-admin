import {
  EntityManager,
  IMigrator,
  MikroORM,
  Options,
} from '@mikro-orm/postgresql'

export interface Services {
  orm: MikroORM
  em: EntityManager
  migrator: IMigrator
}

let cache: Services

export async function initORM(options?: Options): Promise<Services> {
  if (cache) {
    return cache
  }

  const orm = options ? await MikroORM.init(options) : await MikroORM.init()

  return (cache = {
    orm,
    em: orm.em.fork(),
    migrator: orm.migrator,
  })
}
