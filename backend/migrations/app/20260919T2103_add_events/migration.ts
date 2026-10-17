#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/98768cfd052260452c0e964d1337fb308332dc41277f0c7f88ad978019ca4d1b/contract';
import endContract from '../../snapshots/98768cfd052260452c0e964d1337fb308332dc41277f0c7f88ad978019ca4d1b/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/be1a23e137ecb307b1de8cd6d92eefb61fc8116b455447fc22eecb76fc356bc4/contract';
import startContract from '../../snapshots/be1a23e137ecb307b1de8cd6d92eefb61fc8116b455447fc22eecb76fc356bc4/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'event',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('endsAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('location', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('organizationId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('startsAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'event',
        index: 'event_organizationId_idx_2e17ef41',
        columns: ['organizationId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'event',
        foreignKey: {
          name: 'event_organizationId_fkey',
          columns: ['organizationId'],
          references: { schema: 'public', table: 'organization', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
