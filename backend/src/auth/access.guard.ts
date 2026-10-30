import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { jwtVerify } from 'jose';
import type { Request } from 'express';
import { db } from '../prisma/db.js';

export type UserRole = 'ADMIN' | 'ORGANIZER' | 'RECEPTION';

export type AccessUser = {
  id: number;
  username: string;
  role: UserRole;
};

export type AuthenticatedRequest = Request & {
  user?: AccessUser;
};

@Injectable()
export class AccessGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const authorization = request.header('authorization');

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication required');
    }

    const token = authorization.slice(7);
    const secret = process.env.USER_SESSION_SECRET;

    if (!secret || secret.length < 32) {
      throw new UnauthorizedException('Authentication unavailable');
    }

    let userId: number;

    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(secret),
        { algorithms: ['HS256'] },
      );

      userId = Number(payload.sub);

      if (!Number.isSafeInteger(userId) || userId <= 0) {
        throw new Error('Invalid user ID');
      }
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }

    const users = await db.orm.public.User.all();
    const user = users.find((item) => item.id === userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is inactive or not found');
    }

    request.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    return true;
  }
}

@Injectable()
export class EventAccessGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const user = request.user;

    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.role === 'ADMIN') {
      return true;
    }

    const eventId = Number(request.params.eventId);

    if (!Number.isSafeInteger(eventId) || eventId <= 0) {
      throw new ForbiddenException('Invalid event');
    }

    const assignments = await db.orm.public.UserEvent.all();

    const assigned = assignments.some(
      (item) => item.userId === user.id && item.eventId === eventId,
    );

    if (!assigned) {
      throw new ForbiddenException('Event access denied');
    }

    return true;
  }
}

@Injectable()
export class AttendeeManagementGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const role = request.user?.role;

    if (role !== 'ADMIN' && role !== 'ORGANIZER') {
      throw new ForbiddenException('Attendee management access denied');
    }

    return true;
  }
}

@Injectable()
export class AdminRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
