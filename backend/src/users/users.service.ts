import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash } from 'bcryptjs';
import { db } from '../prisma/db.js';

type NewUserRole = 'ORGANIZER' | 'RECEPTION';

export type CreateUserDto = {
  username: string;
  password: string;
  name?: string;
  email?: string;
  role: NewUserRole;
  eventIds?: number[];
};

export type UpdateUserDto = {
  username?: string;
  name?: string | null;
  email?: string | null;
  role?: 'ORGANIZER' | 'RECEPTION';
  isActive?: boolean;
};

@Injectable()
export class UsersService {
  async findAll() {
    const users = await db.orm.public.User.all();
    const assignments = await db.orm.public.UserEvent.all();

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      organizationId: user.organizationId,
      createdAt: user.createdAt,
      eventIds: assignments
        .filter((item) => item.userId === user.id)
        .map((item) => item.eventId),
    }));
  }

  async create(adminId: number, body: CreateUserDto) {
    const users = await db.orm.public.User.all();

    const admin = users.find((user) => user.id === adminId);

    if (!admin || !admin.isActive || admin.role !== 'ADMIN') {
      throw new BadRequestException('Invalid administrator');
    }

    const username =
      typeof body?.username === 'string' ? body.username.trim() : '';

    const password = body?.password;

    if (username.length < 3 || username.length > 50) {
      throw new BadRequestException('Username must contain 3-50 characters');
    }

    if (
      typeof password !== 'string' ||
      password.length < 12 ||
      password.length > 128
    ) {
      throw new BadRequestException('Password must contain 12-128 characters');
    }

    if (body.role !== 'ORGANIZER' && body.role !== 'RECEPTION') {
      throw new BadRequestException('Invalid user role');
    }

    const duplicate = users.some(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );

    if (duplicate) {
      throw new ConflictException('Username already exists');
    }

    const eventIds = body.eventIds ?? [];

    if (
      !Array.isArray(eventIds) ||
      eventIds.some((id) => !Number.isSafeInteger(id) || id <= 0) ||
      new Set(eventIds).size !== eventIds.length
    ) {
      throw new BadRequestException('Invalid event IDs');
    }

    const events = await db.orm.public.Event.all();

    for (const eventId of eventIds) {
      const event = events.find((item) => item.id === eventId);

      if (!event) {
        throw new NotFoundException(`Event ${eventId} not found`);
      }

      if (event.organizationId !== admin.organizationId) {
        throw new BadRequestException(
          'Cannot assign events from another organization',
        );
      }
    }

    const passwordHash = await hash(password, 12);

    const user = await db.orm.public.User.create({
      username,
      passwordHash,
      name: typeof body.name === 'string' ? body.name.trim() || null : null,
      email: typeof body.email === 'string' ? body.email.trim() || null : null,
      role: body.role,
      isActive: true,
      organizationId: admin.organizationId,
    });

    for (const eventId of eventIds) {
      await db.orm.public.UserEvent.create({
        userId: user.id,
        eventId,
      });
    }

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      organizationId: user.organizationId,
    };
  }

  async update(adminId: number, userId: number, body: UpdateUserDto) {
    const users = await db.orm.public.User.all();

    const admin = users.find((user) => user.id === adminId);
    const user = users.find((item) => item.id === userId);

    if (!admin || !admin.isActive || admin.role !== 'ADMIN') {
      throw new BadRequestException('Invalid administrator');
    }

    if (!user || user.organizationId !== admin.organizationId) {
      throw new NotFoundException('User not found');
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Invalid request body');
    }

    // Пока запрещаем редактирование ADMIN через этот endpoint.
    if (user.role === 'ADMIN') {
      throw new BadRequestException(
        'Administrator accounts cannot be edited here',
      );
    }

    const updates: {
      username?: string;
      name?: string | null;
      email?: string | null;
      role?: 'ORGANIZER' | 'RECEPTION';
      isActive?: boolean;
    } = {};

    if (body.username !== undefined) {
      if (typeof body.username !== 'string') {
        throw new BadRequestException('Invalid username');
      }

      const username = body.username.trim();

      if (username.length < 3 || username.length > 50) {
        throw new BadRequestException('Username must contain 3-50 characters');
      }

      const duplicate = users.some(
        (item) =>
          item.id !== userId &&
          item.username.toLowerCase() === username.toLowerCase(),
      );

      if (duplicate) {
        throw new ConflictException('Username already exists');
      }

      updates.username = username;
    }

    if (body.name !== undefined) {
      if (body.name !== null && typeof body.name !== 'string') {
        throw new BadRequestException('Invalid name');
      }

      updates.name = body.name?.trim() || null;
    }

    if (body.email !== undefined) {
      if (body.email !== null && typeof body.email !== 'string') {
        throw new BadRequestException('Invalid email');
      }

      const email = body.email?.trim() || null;

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new BadRequestException('Invalid email format');
      }

      updates.email = email;
    }

    if (body.role !== undefined) {
      if (body.role !== 'ORGANIZER' && body.role !== 'RECEPTION') {
        throw new BadRequestException('Invalid role');
      }

      updates.role = body.role;
    }

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== 'boolean') {
        throw new BadRequestException('Invalid active status');
      }

      updates.isActive = body.isActive;
    }

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    await db.orm.public.User.where({
      id: userId,
    }).update(updates);

    const usersAfterUpdate = await db.orm.public.User.all();

    const updatedUser = usersAfterUpdate.find((item) => item.id === userId);

    if (!updatedUser) {
      throw new NotFoundException('User not found after update');
    }

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      organizationId: updatedUser.organizationId,
    };
  }

  async updateEvents(adminId: number, userId: number, eventIds: number[]) {
    const users = await db.orm.public.User.all();

    const admin = users.find((item) => item.id === adminId);
    const user = users.find((item) => item.id === userId);

    if (!admin || !admin.isActive || admin.role !== 'ADMIN') {
      throw new BadRequestException('Invalid administrator');
    }

    if (!user || user.organizationId !== admin.organizationId) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException(
        'Cannot modify administrator event assignments',
      );
    }

    if (
      !Array.isArray(eventIds) ||
      eventIds.some((id) => !Number.isSafeInteger(id) || id <= 0) ||
      new Set(eventIds).size !== eventIds.length
    ) {
      throw new BadRequestException('Invalid event IDs');
    }

    const events = await db.orm.public.Event.all();

    for (const eventId of eventIds) {
      const event = events.find((item) => item.id === eventId);

      if (!event || event.organizationId !== admin.organizationId) {
        throw new BadRequestException(`Event ${eventId} is not available`);
      }
    }

    const assignments = await db.orm.public.UserEvent.all();

    const current = assignments.filter((item) => item.userId === userId);

    const currentIds = new Set(current.map((item) => item.eventId));

    const requestedIds = new Set(eventIds);

    // Удаляем назначения, которые ADMIN снял.
    for (const assignment of current) {
      if (!requestedIds.has(assignment.eventId)) {
        await db.orm.public.UserEvent.where({
          id: assignment.id,
        }).delete();
      }
    }

    // Добавляем новые назначения.
    for (const eventId of eventIds) {
      if (!currentIds.has(eventId)) {
        await db.orm.public.UserEvent.create({
          userId,
          eventId,
        });
      }
    }

    return {
      userId,
      eventIds,
    };
  }

  async resetPassword(adminId: number, userId: number, newPassword: string) {
    const users = await db.orm.public.User.all();

    const admin = users.find((item) => item.id === adminId);
    const user = users.find((item) => item.id === userId);

    if (!admin || !admin.isActive || admin.role !== 'ADMIN') {
      throw new BadRequestException('Invalid administrator');
    }

    if (!user || user.organizationId !== admin.organizationId) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('Cannot reset administrator password');
    }

    if (
      typeof newPassword !== 'string' ||
      newPassword.length < 12 ||
      newPassword.length > 128
    ) {
      throw new BadRequestException('Password must contain 12-128 characters');
    }

    const passwordHash = await hash(newPassword, 12);

    await db.orm.public.User.where({
      id: userId,
    }).update({
      passwordHash,
    });

    return {
      success: true,
      message: 'Password updated successfully',
    };
  }
}
