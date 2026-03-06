import { Collection, Entity, ManyToMany, OptionalProps, PrimaryKey, Property } from '@mikro-orm/core';
import { Role } from './role.entity.js';

@Entity()
export class User {

    [OptionalProps]?: 'mfaEnabled' | 'bio' | 'password' | 'oauthProvider' | 'oauthId' | 'mfaCode' | 'mfaCodeExpiresAt';

    @PrimaryKey()
    id!: number;

    @Property({ unique: true })
    username!: string;

    @Property()
    fullName!: string;

    @Property()
    email!: string;

    @Property({ nullable: true })
    password?: string;

    @Property({ nullable: true })
    oauthProvider?: string;

    @Property({ nullable: true })
    oauthId?: string;

    @Property({ default: false })
    mfaEnabled: boolean = false;

    @Property({ nullable: true })
    mfaCode?: string;

    @Property({ nullable: true })
    mfaCodeExpiresAt?: Date;

    @Property({ type: 'text' })
    bio = '';

    @ManyToMany(() => Role, (role) => role.users)
    roles = new Collection<Role>(this);
}
