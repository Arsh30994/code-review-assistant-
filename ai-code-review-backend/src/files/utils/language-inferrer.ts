// src/files/utils/language-inferrer.ts
import * as path from 'path';

/**
 * Maps a file extension (lowercase, dot-prefixed) → canonical language name.
 * Extend freely as needed.
 */
const EXTENSION_LANGUAGE_MAP: Readonly<Record<string, string>> = {
  // JavaScript / TypeScript
  '.js':    'JavaScript',
  '.jsx':   'JavaScript',
  '.mjs':   'JavaScript',
  '.cjs':   'JavaScript',
  '.ts':    'TypeScript',
  '.tsx':   'TypeScript',
  '.d.ts':  'TypeScript',

  // Python
  '.py':    'Python',
  '.pyw':   'Python',
  '.pyi':   'Python',

  // Rust / Go / C-family
  '.rs':    'Rust',
  '.go':    'Go',
  '.c':     'C',
  '.h':     'C',
  '.cpp':   'C++',
  '.cc':    'C++',
  '.cxx':   'C++',
  '.hpp':   'C++',
  '.cs':    'C#',

  // JVM
  '.java':  'Java',
  '.kt':    'Kotlin',
  '.kts':   'Kotlin',
  '.scala': 'Scala',

  // Web
  '.html':  'HTML',
  '.htm':   'HTML',
  '.css':   'CSS',
  '.scss':  'SCSS',
  '.sass':  'Sass',
  '.less':  'Less',
  '.vue':   'Vue',
  '.svelte':'Svelte',

  // Data / Config
  '.json':  'JSON',
  '.jsonc': 'JSON',
  '.yaml':  'YAML',
  '.yml':   'YAML',
  '.toml':  'TOML',
  '.xml':   'XML',
  '.csv':   'CSV',
  '.sql':   'SQL',

  // Shell
  '.sh':    'Shell',
  '.bash':  'Shell',
  '.zsh':   'Shell',
  '.fish':  'Shell',
  '.ps1':   'PowerShell',

  // Markup / Docs
  '.md':    'Markdown',
  '.mdx':   'Markdown',
  '.rst':   'reStructuredText',
  '.tex':   'LaTeX',

  // Other
  '.rb':    'Ruby',
  '.php':   'PHP',
  '.swift': 'Swift',
  '.dart':  'Dart',
  '.r':     'R',
  '.lua':   'Lua',
  '.ex':    'Elixir',
  '.exs':   'Elixir',
  '.hs':    'Haskell',
  '.tf':    'Terraform',
  '.proto': 'Protobuf',
  '.graphql':'GraphQL',
  '.gql':   'GraphQL',
  '.dockerfile': 'Dockerfile',
};

/**
 * Infer a human-readable language name from a filename or path.
 * Returns `null` when the extension is unknown.
 *
 * @example
 * inferLanguage('src/app.ts')   // → 'TypeScript'
 * inferLanguage('Dockerfile')   // → 'Dockerfile'
 * inferLanguage('README.md')    // → 'Markdown'
 * inferLanguage('unknown.xyz')  // → null
 */
export function inferLanguage(filename: string): string | null {
  const base = path.basename(filename).toLowerCase();

  // Handle special no-extension files (Dockerfile, Makefile, etc.)
  if (base === 'dockerfile' || base.startsWith('dockerfile.')) return 'Dockerfile';
  if (base === 'makefile') return 'Makefile';
  if (base === '.env' || base.startsWith('.env.')) return 'Dotenv';
  if (base === '.gitignore' || base === '.dockerignore') return 'Ignore file';

  const ext = path.extname(base);
  if (!ext) return null;

  return EXTENSION_LANGUAGE_MAP[ext] ?? null;
}
