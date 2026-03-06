import { EntityManager, EntityClass } from '@mikro-orm/core';

export class EntityInterface<T extends object> {
    private em: EntityManager;
    private entity: EntityClass<T>;

    constructor(em: EntityManager, entity: EntityClass<T>) {
        this.em = em;
        this.entity = entity;
    }

    private get repo() {
        return this.em.getRepository(this.entity);
    }

    findAll(): Promise<T[]> { return this.repo.findAll({ populate: ['*'] as any }); }

    findById(id: number | string): Promise<T | null> {
        return this.repo.findOne({ id } as any, { populate: ['*'] as any });
    }

    async create(data: Partial<T>): Promise<T> {
        const item = this.em.create(this.entity, data as any);
        await this.em.persistAndFlush(item);
        return item;
    }

    async update(id: number | string, data: Partial<T>): Promise<T | null> {
        const item = await this.repo.findOne({ id } as any, { populate: ['*'] as any });
        if (!item) return null;
        this.em.assign(item, data as any);
        await this.em.flush();
        return item;
    }

    async delete(id: number | string): Promise<boolean> {
        const item = await this.repo.findOne({ id } as any);
        if (!item) return false;
        await this.em.removeAndFlush(item);
        return true;
    }
}
