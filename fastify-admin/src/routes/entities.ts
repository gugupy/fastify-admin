import { EntityManager } from '@mikro-orm/core';
import { FastifyInstance } from 'fastify';
import { EntityRegistry } from '../registry.js';
import { EntityInterface } from '../entityInterface.js';

export async function registerEntityRoutes(
    app: FastifyInstance,
    em: EntityManager,
    registry: EntityRegistry,
) {
    for (const entity of registry.getAll()) {
        const base = `/api/${entity.name}`;
        const iface = new EntityInterface(em, entity.entity);

        app.get(base, () => iface.findAll());
        app.get(`${base}/:id`, (req: any) => iface.findById(req.params.id));
        app.post(base, (req: any) => iface.create(req.body));
        app.put(`${base}/:id`, (req: any) => iface.update(req.params.id, req.body));
        app.delete(`${base}/:id`, async (req: any) => {
            const deleted = await iface.delete(req.params.id);
            return { success: deleted };
        });
    }
}
