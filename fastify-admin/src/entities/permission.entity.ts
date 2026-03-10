import {
  Collection,
  Entity,
  ManyToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core'
import { Role } from './role.entity.js'

@Entity()
export class Permission {
  @PrimaryKey()
  id!: number

  @Property({ unique: true })
  name!: string

  @ManyToMany(() => Role, (role) => role.permissions, { owner: true })
  roles = new Collection<Role>(this)
}
