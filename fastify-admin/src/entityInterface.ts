import { EntityManager, EntityClass, FindOneOptions } from '@mikro-orm/core'

export class EntityInterface<T extends object> {
  private em: EntityManager
  private entity: EntityClass<T>

  constructor(em: EntityManager, entity: EntityClass<T>) {
    this.em = em
    this.entity = entity
  }

  private get repo() {
    return this.em.getRepository(this.entity)
  }

  findAll(fields?: string[] | undefined): Promise<T[]> {
    const opts: any = {}
    if (fields !== undefined) {
      opts.fields = fields
    }

    return this.repo.findAll(opts) as Promise<T[]>
  }

  async findPaginated(
    page: number,
    limit: number,
    fields?: string[] | undefined,
  ): Promise<{ data: T[]; total: number }> {
    const offset = (page - 1) * limit
    const opts: any = { limit, offset }
    if (fields !== undefined) {
      opts.fields = fields
    }
    const [data, total] = await this.repo.findAndCount({}, opts)
    return { data, total }
  }

  async findById(id: number | string, opts = {}): Promise<T | null> {
    return this.repo.findOne({ id } as any, opts) as Promise<T | null>
  }

  async create(data: Partial<T>): Promise<T> {
    const item = this.em.create(this.entity, data as any)
    await this.em.persist(item).flush()
    return item
  }

  async update(id: number | string, data: Partial<T>): Promise<T | null> {
    const item = await this.repo.findOne({ id } as any, {
      populate: ['*'] as any,
    })
    if (!item) return null
    this.em.assign(item, data as any)
    await this.em.flush()
    return item
  }

  async delete(id: number | string): Promise<boolean> {
    const item = await this.repo.findOne({ id } as any)
    if (!item) return false
    await this.em.removeAndFlush(item)
    return true
  }
}
