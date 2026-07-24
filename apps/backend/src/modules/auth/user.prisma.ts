import { Injectable } from '@nestjs/common';
import { User, UserPageParams, UserRepository } from '@poupig/auth';
import { User as PrismaUser } from '@prisma/client';
import { PrismaService } from '../../db/prisma.service';

type UserPageResult = Awaited<ReturnType<UserRepository['findPage']>>;

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: User): Promise<User> {
    const user = await this.prisma.user.create({
      data: this.toCreateData(data),
    });

    return this.toDomain(user);
  }

  async update(data: User): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: data.id },
    });

    if (!existingUser) {
      throw new Error(`User with id "${data.id}" was not found.`);
    }

    const user = await this.prisma.user.update({
      where: { id: data.id },
      data: this.toUpdateData(data),
    });

    return this.toDomain(user);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.deleteMany({
      where: { id },
    });
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return user ? this.toDomain(user) : null;
  }

  async findPage(params: UserPageParams): Promise<UserPageResult> {
    const page = Math.max(params.page, 1);
    const perPage = Math.max(params.perPage, 1);
    const skip = (page - 1) * perPage;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      items: items.map((item) => this.toDomain(item)),
      page,
      perPage,
      total,
    };
  }

  private toCreateData(data: User) {
    return {
      id: data.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
      name: data.name,
      email: data.email,
      password: data.password,
    };
  }

  private toUpdateData(data: User) {
    return {
      deletedAt: data.deletedAt,
      name: data.name,
      email: data.email,
      password: data.password,
    };
  }

  private toDomain(data: PrismaUser): User {
    return new User({
      id: data.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
      name: data.name,
      email: data.email,
      password: data.password,
    });
  }
}
