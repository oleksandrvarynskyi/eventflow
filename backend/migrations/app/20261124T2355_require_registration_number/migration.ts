#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/19cef38733681e4be64b61433d0c89ba2e0bdff10b3e0318d40111247a8e73f9/contract';
import startContract from '../../snapshots/19cef38733681e4be64b61433d0c89ba2e0bdff10b3e0318d40111247a8e73f9/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/ca4d38ab968e436c61bf1b101d9a5c1222e9ddddcb067bd1a9d9b408997b025c/contract';
import endContract from '../../snapshots/ca4d38ab968e436c61bf1b101d9a5c1222e9ddddcb067bd1a9d9b408997b025c/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.setNotNull({
        schema: 'public',
        table: 'attendee',
        column: 'registrationNumber',
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
