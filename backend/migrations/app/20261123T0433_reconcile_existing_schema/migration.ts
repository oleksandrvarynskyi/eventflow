#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/4c325b128155e4ef96aff717b07f1827b389b758beb86711254b1573be3cdb20/contract';
import startContract from '../../snapshots/4c325b128155e4ef96aff717b07f1827b389b758beb86711254b1573be3cdb20/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/622fe83f480f6fa6f508cd0b58e8c2e2bcff64a64c50d1392017f24ba67baade/contract';
import endContract from '../../snapshots/622fe83f480f6fa6f508cd0b58e8c2e2bcff64a64c50d1392017f24ba67baade/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropCheckConstraint({
        schema: 'public',
        table: 'user',
        constraint: 'user_role_check_4f4846ff',
      }),
      this.createTable({
        schema: 'public',
        table: 'userEvent',
        columns: [
          col('eventId', 'int4', {
            notNull: true,
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('id', 'SERIAL', {
            notNull: true,
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('userId', 'int4', {
            notNull: true,
            codecRef: { codecId: 'pg/int4@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('isActive', 'bool', {
          notNull: true,
          default: lit(true),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('passwordHash', 'text', {
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.setNotNull({
        schema: 'public',
        table: 'user',
        column: 'passwordHash',
      }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('username', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.setNotNull({ schema: 'public', table: 'user', column: 'username' }),
      this.dropNotNull({ schema: 'public', table: 'user', column: 'email' }),
      this.setDefault({
        schema: 'public',
        table: 'user',
        column: 'role',
        defaultSql: "DEFAULT 'ORGANIZER'",
        operationClass: 'widening',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'user',
        constraint: 'user_role_check_e0406534',
        expression: "\"role\" IN ('ADMIN', 'ORGANIZER', 'RECEPTION')",
      }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_username_key',
        columns: ['username'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'userEvent',
        constraint: 'userEvent_userId_eventId_key',
        columns: ['userId', 'eventId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'userEvent',
        index: 'userEvent_eventId_idx_6a266d47',
        columns: ['eventId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'userEvent',
        index: 'userEvent_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'userEvent',
        foreignKey: {
          name: 'userEvent_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'userEvent',
        foreignKey: {
          name: 'userEvent_eventId_fkey',
          columns: ['eventId'],
          references: { schema: 'public', table: 'event', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
