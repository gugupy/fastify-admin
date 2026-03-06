import { EntityManager, MikroORM, Options } from '@mikro-orm/postgresql';

export interface Services {
  orm: MikroORM;
  em: EntityManager;
}

let cache: Services;

export async function initORM(options?: Options): Promise<Services> {
  if (cache) {
    return cache;
  }

  const orm = await MikroORM.init(options);

  return (cache = {
    orm,
    em: orm.em.fork(),
  });
}
