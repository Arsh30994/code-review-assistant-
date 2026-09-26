// src/files/files.module.ts
import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { ConfigurableFilesInterceptor } from './interceptors/multer-files.interceptor';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [AIModule],
  controllers: [FilesController],
  providers: [
    FilesService,
    // Register the interceptor as a provider so NestJS DI can inject
    // ConfigService into it when FilesController's interceptor resolves.
    ConfigurableFilesInterceptor,
  ],
  exports: [FilesService],
})
export class FilesModule {}
