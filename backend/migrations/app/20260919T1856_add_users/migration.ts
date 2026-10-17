#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/a1b4387b960505a1fb354d55a34835ec87869c2bed31c602c07e689e8359fbd5/contract';
import startContract from '../../snapshots/a1b4387b960505a1fb354d55a34835ec87869c2bed31c602c07e689e8359fbd5/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/be1a23e137ecb307b1de8cd6d92eefb61fc8116b455447fc22eecb76fc356bc4/contract';
import endContract from '../../snapshots/be1a23e137ecb307b1de8cd6d92eefb61fc8116b455447fc22eecb76fc356bc4/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'user',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('organizationId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('role', 'text', {
            notNull: true,
            default: lit('EVENT_MANAGER'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'user_role_check_4f4846ff',
            "\"role\" IN ('ADMIN', 'EVENT_MANAGER', 'RECEPTIONIST')",
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_email_key',
        columns: ['email'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'user',
        index: 'user_organizationId_idx_2e17ef41',
        columns: ['organizationId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'user',
        foreignKey: {
          name: 'user_organizationId_fkey',
          columns: ['organizationId'],
          references: { schema: 'public', table: 'organization', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
