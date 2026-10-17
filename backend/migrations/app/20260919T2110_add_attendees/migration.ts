#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/4bab7ca7b32d555463869146ce32b2fce5fcbd39015e5f97823eb58cc2f25b7c/contract';
import endContract from '../../snapshots/4bab7ca7b32d555463869146ce32b2fce5fcbd39015e5f97823eb58cc2f25b7c/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/98768cfd052260452c0e964d1337fb308332dc41277f0c7f88ad978019ca4d1b/contract';
import startContract from '../../snapshots/98768cfd052260452c0e964d1337fb308332dc41277f0c7f88ad978019ca4d1b/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'attendee',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('eventId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('firstName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('lastName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'attendee',
        index: 'attendee_eventId_idx_6a266d47',
        columns: ['eventId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'attendee',
        foreignKey: {
          name: 'attendee_eventId_fkey',
          columns: ['eventId'],
          references: { schema: 'public', table: 'event', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
