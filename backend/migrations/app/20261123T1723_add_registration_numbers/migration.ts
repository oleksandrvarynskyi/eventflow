#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/19cef38733681e4be64b61433d0c89ba2e0bdff10b3e0318d40111247a8e73f9/contract';
import endContract from '../../snapshots/19cef38733681e4be64b61433d0c89ba2e0bdff10b3e0318d40111247a8e73f9/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/9ef0d02943b1fa23a6d40abb192630ee6895da4e5fcb865fa3b1d66574a54021/contract';
import startContract from '../../snapshots/9ef0d02943b1fa23a6d40abb192630ee6895da4e5fcb865fa3b1d66574a54021/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'attendee',
        column: col('registrationNumber', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'event',
        column: col('nextRegistrationNumber', 'int4', {
          notNull: true,
          default: lit(1),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'attendee',
        constraint: 'attendee_eventId_registrationNumber_key',
        columns: ['eventId', 'registrationNumber'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
