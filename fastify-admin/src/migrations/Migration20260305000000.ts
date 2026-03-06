import { Migration } from '@mikro-orm/migrations';

export class Migration20260305000000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`
      create table "user" (
        "id"                   serial primary key,
        "username"             varchar(255) not null unique,
        "full_name"            varchar(255) not null,
        "email"                varchar(255) not null,
        "password"             varchar(255) null,
        "oauth_provider"       varchar(255) null,
        "oauth_id"             varchar(255) null,
        "mfa_enabled"          boolean not null default false,
        "mfa_code"             varchar(255) null,
        "mfa_code_expires_at"  timestamptz null,
        "bio"                  text not null default ''
      );
    `);

    this.addSql(`
      create table "role" (
        "id"   serial primary key,
        "name" varchar(255) not null
      );
      alter table "role" add constraint "role_name_unique" unique ("name");
    `);

    this.addSql(`
      create table "role_users" (
        "role_id" int not null,
        "user_id" int not null,
        constraint "role_users_pkey" primary key ("role_id", "user_id")
      );
      alter table "role_users"
        add constraint "role_users_role_id_foreign"
          foreign key ("role_id") references "role" ("id") on update cascade on delete cascade;
      alter table "role_users"
        add constraint "role_users_user_id_foreign"
          foreign key ("user_id") references "user" ("id") on update cascade on delete cascade;
    `);

    this.addSql(`
      create table "permission" (
        "id"   serial primary key,
        "name" varchar(255) not null
      );
      alter table "permission" add constraint "permission_name_unique" unique ("name");
    `);

    this.addSql(`
      create table "permission_roles" (
        "permission_id" int not null,
        "role_id"       int not null,
        constraint "permission_roles_pkey" primary key ("permission_id", "role_id")
      );
      alter table "permission_roles"
        add constraint "permission_roles_permission_id_foreign"
          foreign key ("permission_id") references "permission" ("id") on update cascade on delete cascade;
      alter table "permission_roles"
        add constraint "permission_roles_role_id_foreign"
          foreign key ("role_id") references "role" ("id") on update cascade on delete cascade;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "permission_roles" cascade;`);
    this.addSql(`drop table if exists "permission" cascade;`);
    this.addSql(`drop table if exists "role_users" cascade;`);
    this.addSql(`drop table if exists "role" cascade;`);
    this.addSql(`drop table if exists "user" cascade;`);
  }

}
