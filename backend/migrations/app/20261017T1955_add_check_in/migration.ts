#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/007f011e72e5d891bfc65c4938db8d8f9eacd4c605dd5e172da0c620b90a9360/contract';
import startContract from '../../snapshots/007f011e72e5d891bfc65c4938db8d8f9eacd4c605dd5e172da0c620b90a9360/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/4c325b128155e4ef96aff717b07f1827b389b758beb86711254b1573be3cdb20/contract';
import endContract from '../../snapshots/4c325b128155e4ef96aff717b07f1827b389b758beb86711254b1573be3cdb20/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'attendee',
        column: col('checkedInAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
