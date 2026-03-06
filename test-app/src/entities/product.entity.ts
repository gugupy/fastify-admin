import { Entity, PrimaryKey, Property } from '@mikro-orm/core'

@Entity()
export class Product {
  @PrimaryKey()
  id!: number

  @Property()
  name!: string

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  price!: number

  @Property({ nullable: true })
  description?: string

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date()
}
