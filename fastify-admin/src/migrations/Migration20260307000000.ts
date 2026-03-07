import { Migration } from '@mikro-orm/migrations'

export class Migration20260307000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "user" add column "email_verified" boolean not null default false;`,
    )
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user" drop column "email_verified";`)
  }
}
