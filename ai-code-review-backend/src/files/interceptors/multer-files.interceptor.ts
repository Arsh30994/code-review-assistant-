// src/files/interceptors/multer-files.interceptor.ts
/**
 * A config-aware multer interceptor that reads MAX_FILE_SIZE_MB from the
 * NestJS ConfigService at injection time (not at decorator-parse time).
 *
 * This solves the classic NestJS issue where @UseInterceptors(FilesInterceptor(...))
 * requires static options that cannot reference DI-injected values.
 *
 * Usage in controller:
 *   @UseInterceptors(ConfigurableFilesInterceptor)
 *   uploadMany(@UploadedFiles() files: Express.Multer.File[]) { ... }
 */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Observable } from 'rxjs';
import { multerOptionsFactory } from '../multer.config';

@Injectable()
export class ConfigurableFilesInterceptor implements NestInterceptor {
  private readonly delegateInterceptor: NestInterceptor;

  constructor(config: ConfigService) {
    // Build the standard NestJS FilesInterceptor with config-driven options.
    // FilesInterceptor returns a class; we instantiate it here so DI has no
    // need to resolve it separately.
    const InterceptorClass = FilesInterceptor('files', 50, multerOptionsFactory(config));
    this.delegateInterceptor = new InterceptorClass();
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return this.delegateInterceptor.intercept(context, next);
  }
}
