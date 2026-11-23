#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/622fe83f480f6fa6f508cd0b58e8c2e2bcff64a64c50d1392017f24ba67baade/contract';
import startContract from '../../snapshots/622fe83f480f6fa6f508cd0b58e8c2e2bcff64a64c50d1392017f24ba67baade/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/9ef0d02943b1fa23a6d40abb192630ee6895da4e5fcb865fa3b1d66574a54021/contract';
import endContract from '../../snapshots/9ef0d02943b1fa23a6d40abb192630ee6895da4e5fcb865fa3b1d66574a54021/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'event',
        column: col('publicSlug', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'event',
        constraint: 'event_publicSlug_key',
        columns: ['publicSlug'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
