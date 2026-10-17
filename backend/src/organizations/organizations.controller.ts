import { Body, Controller, Get, Post } from '@nestjs/common';
import { db } from '../prisma/db.js';

@Controller('organizations')
export class OrganizationsController {
  @Get()
  async findAll() {
    return db.orm.public.Organization.all();
  }

  @Post()
  async create(@Body() body: { name: string }) {
    return db.orm.public.Organization.create({
      name: body.name,
    });
  }
}
