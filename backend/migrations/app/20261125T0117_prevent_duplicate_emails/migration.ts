#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/907bc1a7e278c5429b8fa7dafe46b455b3ce276a8240d8589d1636e9900805db/contract';
import endContract from '../../snapshots/907bc1a7e278c5429b8fa7dafe46b455b3ce276a8240d8589d1636e9900805db/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/ca4d38ab968e436c61bf1b101d9a5c1222e9ddddcb067bd1a9d9b408997b025c/contract';
import startContract from '../../snapshots/ca4d38ab968e436c61bf1b101d9a5c1222e9ddddcb067bd1a9d9b408997b025c/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addUnique({
        schema: 'public',
        table: 'attendee',
        constraint: 'attendee_eventId_email_key',
        columns: ['eventId', 'email'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
