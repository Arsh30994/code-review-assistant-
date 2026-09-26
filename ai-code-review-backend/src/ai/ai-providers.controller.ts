// src/ai/ai-providers.controller.ts
import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe,
  Patch, Post, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AIProvidersService } from './ai-providers.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('ai/providers')
export class AIProvidersController {
  constructor(private readonly aiProvidersService: AIProvidersService) {}

  @Post()
  create(@Body() dto: CreateProviderDto) {
    return this.aiProvidersService.create(dto);
  }

  @Get()
  findAll() {
    return this.aiProvidersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.aiProvidersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProviderDto) {
    return this.aiProvidersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.aiProvidersService.remove(id);
  }
}
