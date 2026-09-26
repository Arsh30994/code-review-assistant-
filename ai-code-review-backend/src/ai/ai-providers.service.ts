// src/ai/ai-providers.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';

@Injectable()
export class AIProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateProviderDto) {
    return this.prisma.aIProvider.create({ data: dto });
  }

  findAll() {
    return this.prisma.aIProvider.findMany({
      orderBy: { name: 'asc' },
      // Never return apiKey to the client
      select: { id: true, name: true, baseUrl: true, model: true, isActive: true, createdAt: true },
    });
  }

  async findOne(id: string) {
    const provider = await this.prisma.aIProvider.findUnique({
      where: { id },
      select: { id: true, name: true, baseUrl: true, model: true, isActive: true, createdAt: true },
    });
    if (!provider) throw new NotFoundException(`Provider ${id} not found`);
    return provider;
  }

  async update(id: string, dto: UpdateProviderDto) {
    await this.findOne(id);
    return this.prisma.aIProvider.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.aIProvider.delete({ where: { id } });
  }
}
