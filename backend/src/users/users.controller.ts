import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  AccessGuard,
  AdminRoleGuard,
  type AuthenticatedRequest,
} from '../auth/access.guard.js';

import {
  UsersService,
  type CreateUserDto,
  type UpdateUserDto,
} from './users.service.js';

@Controller('users')
@UseGuards(AccessGuard, AdminRoleGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateUserDto,
  ) {
    return this.usersService.create(request.user!.id, body);
  }

  @Patch(':userId')
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: UpdateUserDto,
  ) {
    return this.usersService.update(request.user!.id, userId, body);
  }

  @Patch(':userId/events')
  async updateEvents(
    @Req() request: AuthenticatedRequest,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: { eventIds: number[] },
  ) {
    return this.usersService.updateEvents(
      request.user!.id,
      userId,
      body?.eventIds,
    );
  }

  @Patch(':userId/password')
  async resetPassword(
    @Req() request: AuthenticatedRequest,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: { password: string },
  ) {
    return this.usersService.resetPassword(
      request.user!.id,
      userId,
      body?.password,
    );
  }
}
