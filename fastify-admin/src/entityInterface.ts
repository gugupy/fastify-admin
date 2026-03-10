import { EntityManager, EntityClass } from '@mikro-orm/core'

/**
 * Thin wrapper around a MikroORM repository that provides the
 * CRUD operations used by the entity routes.
 *
 * A fresh instance is created per entity when routes are registered,
 * sharing the same EntityManager (request-scoped via RequestContext).
 */
export class EntityInterface<T extends object> {
  private em: EntityManager
  private entity: EntityClass<T>

  constructor(em: EntityManager, entity: EntityClass<T>) {
    this.em = em
    this.entity = entity
  }

  /** Returns the MikroORM repository for the entity. */
  private get repo() {
    return this.em.getRepository(this.entity)
  }

  /**
   * Returns all records.
   * Pass `fields` to restrict which columns are selected;
   * undefined or empty array returns all fields.
   */
  findAll(fields?: string[] | undefined): Promise<T[]> {
    const opts: any = {}
    // undefined or empty array both mean "return all fields"
    if (fields?.length) {
      opts.fields = fields
      opts.populate = fields
    }
    globalThis.console.log('Fields All: ', opts)
    return this.repo.findAll(opts) as Promise<T[]>
  }

  /**
   * Returns a paginated slice of records plus the total count.
   * `page` is 1-based; `limit` is the page size.
   * Pass `fields` to restrict which columns are selected;
   * undefined or empty array returns all fields.
   */
  async findPaginated(
    page: number,
    limit: number,
    fields?: string[] | undefined,
  ): Promise<{ data: T[]; total: number }> {
    const offset = (page - 1) * limit
    const opts: any = { limit, offset }
    // undefined or empty array both mean "return all fields"

    if (fields?.length) {
      opts.fields = fields
      opts.populate = fields
    }

    globalThis.console.log('Fields: ', opts)

    const [data, total] = await this.repo.findAndCount({}, opts)
    return { data, total }
  }

  /**
   * Returns a single record by id, or null if not found.
   * `opts` is passed directly to MikroORM findOne — use it to set
   * `populate` and `fields` for relation loading.
   */
  async findById(id: number | string, opts = {}): Promise<T | null> {
    return this.repo.findOne({ id } as any, opts) as Promise<T | null>
  }

  /**
   * Creates and persists a new record.
   * Returns the created entity with its generated id.
   */
  async create(data: Partial<T>): Promise<T> {
    const item = this.em.create(this.entity, data as any)
    await this.em.persist(item).flush()
    return item
  }

  /**
   * Updates an existing record by id.
   * Populates all relations before assigning so that relation fields
   * (e.g. roles) can be updated correctly via em.assign.
   * Returns null if the record does not exist.
   */
  async update(id: number | string, data: Partial<T>): Promise<T | null> {
    const item = await this.repo.findOne({ id } as any, {
      populate: ['*'] as any,
    })
    if (!item) return null
    this.em.assign(item, data as any)
    await this.em.flush()
    return item
  }

  /**
   * Deletes a record by id.
   * Returns true if the record was found and deleted, false otherwise.
   */
  async delete(id: number | string): Promise<boolean> {
    const item = await this.repo.findOne({ id } as any)
    if (!item) return false
    await this.em.remove(item).flush()
    return true
  }
}
