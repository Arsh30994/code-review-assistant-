// src/files/multer.config.ts
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import * as multer from 'multer';
import * as path from 'path';

/**
 * Text-only MIME types / extensions we accept.
 * Binary blobs (images, archives, executables) are rejected.
 */
const ALLOWED_EXTENSIONS = new Set([
  '.js', '.jsx', '.mjs', '.cjs',
  '.ts', '.tsx', '.d.ts',
  '.py', '.pyw', '.pyi',
  '.rs', '.go', '.c', '.h', '.cpp', '.cc', '.cxx', '.hpp', '.cs',
  '.java', '.kt', '.kts', '.scala',
  '.rb', '.php', '.swift', '.dart', '.r', '.lua', '.ex', '.exs', '.hs',
  '.html', '.htm', '.css', '.scss', '.sass', '.less', '.vue', '.svelte',
  '.json', '.jsonc', '.yaml', '.yml', '.toml', '.xml', '.csv', '.sql',
  '.sh', '.bash', '.zsh', '.fish', '.ps1',
  '.md', '.mdx', '.rst', '.tex',
  '.tf', '.proto', '.graphql', '.gql',
  '.env', '.gitignore', '.dockerignore',
]);

/**
 * Factory function so ConfigService can inject MAX_FILE_SIZE_MB at startup.
 *
 * Usage in controller:
 *   @UseInterceptors(FilesInterceptor('files', 20, multerOptionsFactory(configService)))
 */
export function multerOptionsFactory(config: ConfigService): MulterOptions {
  const maxMb = config.get<number>('MAX_FILE_SIZE_MB', 5);
  const maxBytes = maxMb * 1024 * 1024;

  return {
    // Keep file contents in memory — content is stored as Text in Postgres.
    // For very large repos consider streaming to disk with DiskStorage,
    // then reading the file async in the service.
    storage: multer.memoryStorage(),

    limits: {
      fileSize: maxBytes,        // per-file size limit
      files: 50,                 // max files per upload request
    },

    fileFilter: (_req, file, cb) => {
      const originalName = file.originalname.toLowerCase();
      const ext = path.extname(originalName);

      // Allow Dockerfile / Makefile with no extension
      const noExtBase = path.basename(originalName, ext);
      if (!ext && ['dockerfile', 'makefile', '.env', '.gitignore'].includes(noExtBase)) {
        return cb(null, true);
      }

      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return cb(
          new BadRequestException(
            `File "${file.originalname}" has an unsupported extension "${ext}". ` +
            `Only text/source-code files are accepted.`,
          ),
          false,
        );
      }

      cb(null, true);
    },
  };
}
