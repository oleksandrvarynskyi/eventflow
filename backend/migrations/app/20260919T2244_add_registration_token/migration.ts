#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/007f011e72e5d891bfc65c4938db8d8f9eacd4c605dd5e172da0c620b90a9360/contract';
import endContract from '../../snapshots/007f011e72e5d891bfc65c4938db8d8f9eacd4c605dd5e172da0c620b90a9360/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/4bab7ca7b32d555463869146ce32b2fce5fcbd39015e5f97823eb58cc2f25b7c/contract';
import startContract from '../../snapshots/4bab7ca7b32d555463869146ce32b2fce5fcbd39015e5f97823eb58cc2f25b7c/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'attendee',
        column: col('registrationToken', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'attendee',
        constraint: 'attendee_registrationToken_key',
        columns: ['registrationToken'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
