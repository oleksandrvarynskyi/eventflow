import { Injectable } from '@nestjs/common';
import { compare } from 'bcryptjs';
import { db } from '../prisma/db.js';

export type AuthenticatedUser = {
  id: number;
  username: string;
  role: 'ADMIN' | 'ORGANIZER' | 'RECEPTION';
};

@Injectable()
export class AuthService {
  async validateUser(
    username: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    if (
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      !username.trim() ||
      !password
    ) {
      return null;
    }

    const users = await db.orm.public.User.all();

    const user = users.find(
      (candidate) => candidate.username === username.trim(),
    );

    if (!user || !user.isActive) {
      return null;
    }

    const passwordMatches = await compare(password, user.passwordHash);

    if (!passwordMatches) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  }
}