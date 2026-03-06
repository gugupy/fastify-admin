import { EntityManager } from '@mikro-orm/core';
import { Permission } from './entities/permission.entity.js';
import { Role } from './entities/role.entity.js';
import { EntityRegistry } from './registry.js';

const ENTITY_ACTIONS = ['list', 'show', 'create', 'edit', 'delete'] as const;

export async function seedRbac(em: EntityManager, registry: EntityRegistry) {
    const fork = em.fork();

    const expectedNames: string[] = [];
    for (const entity of registry.getAll()) {
        for (const action of ENTITY_ACTIONS) {
            expectedNames.push(`${entity.name}.${action}`);
        }
    }

    const existing = await fork.find(Permission, { name: { $in: expectedNames } });
    const existingNames = new Set(existing.map((p) => p.name));

    const newPerms: Permission[] = [];
    for (const name of expectedNames) {
        if (!existingNames.has(name)) {
            newPerms.push(fork.create(Permission, { name }));
        }
    }
    if (newPerms.length) await fork.persistAndFlush(newPerms);

    let adminRole = await fork.findOne(Role, { name: 'Admin' }, { populate: ['permissions'] });
    if (!adminRole) {
        const created = fork.create(Role, { name: 'Admin' });
        await fork.persistAndFlush(created);
        await fork.populate(created, ['permissions']);
        adminRole = created as unknown as typeof adminRole;
    }

    const allPerms = await fork.find(Permission, { name: { $in: expectedNames } });
    const adminPermNames = new Set(adminRole!.permissions.getItems().map((p) => p.name));
    const toAdd = allPerms.filter((p) => !adminPermNames.has(p.name));
    if (toAdd.length) {
        for (const p of toAdd) adminRole!.permissions.add(p);
        await fork.flush();
    }

    console.log(`[rbac] ${expectedNames.length} permissions ensured, Admin role synced.`);
}
