import { Collection, Entity, ManyToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { Permission } from './permission.entity.js';
import { User } from './user.entity.js';

@Entity()
export class Role {

    @PrimaryKey()
    id!: number;

    @Property({ unique: true })
    name!: string;

    @ManyToMany(() => User, (user) => user.roles, { owner: true })
    users = new Collection<User>(this);

    @ManyToMany(() => Permission, (permission) => permission.roles)
    permissions = new Collection<Permission>(this);
}
