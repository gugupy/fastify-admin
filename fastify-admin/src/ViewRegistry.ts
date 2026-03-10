import type { ViewConfig } from './types.js'

/**
 * User-facing registry for collecting EntityView configs across multiple files.
 *
 * @example
 * // src/views/index.ts
 * import { ViewRegistry } from 'fastify-admin'
 * import { UserView } from './user.view.js'
 * import { ProductView } from './product.view.js'
 *
 * export const views = new ViewRegistry()
 *   .register('user', new UserView())
 *   .register('product', new ProductView())
 *
 * // src/server.ts
 * await app.register(fastifyAdmin, { orm, views })
 */
export class ViewRegistry {
  private _views: Map<string, ViewConfig> = new Map()

  /**
   * Register a view for the given entity collection name.
   * Returns `this` for chaining.
   */
  register(entityName: string, view: ViewConfig): this {
    this._views.set(entityName, view)
    return this
  }

  entries(): [string, ViewConfig][] {
    return [...this._views.entries()]
  }
}
