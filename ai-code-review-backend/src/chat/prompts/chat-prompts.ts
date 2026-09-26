// src/chat/prompts/chat-prompts.ts

export interface ChatRetrievedContext {
  projectName?: string;
  projectDescription?: string;
  allFilePaths: string[];
  matchedFiles: Array<{
    path: string;
    language?: string | null;
    content: string;
  }>;
  retrievalStrategy: 'filename_match' | 'key_files_summary' | 'no_project';
}

export const CHAT_SYSTEM_PROMPT = `You are an expert Senior Full-Stack Software Engineer and AI Pair Programmer assistant.
You have direct access to the user's project codebase context provided below.

Guidelines:
1. Ground your answers in the provided codebase context and files whenever relevant.
2. Provide precise, production-grade code snippets with appropriate syntax highlighting.
3. If referencing code, specify exact filenames, functions, types, and line concepts from the context.
4. When suggesting changes or refactors, explain the rationale clearly and provide concrete diffs or implementations.
5. If the required information is not in the context, state what is missing and suggest which file to inspect.`;

export function buildChatSystemPromptWithContext(context: ChatRetrievedContext): string {
  if (context.retrievalStrategy === 'no_project') {
    return CHAT_SYSTEM_PROMPT;
  }

  const fileListBlock =
    context.allFilePaths.length > 0
      ? `### Project File Tree / Directory:
${context.allFilePaths.map((p) => `- ${p}`).join('\n')}`
      : 'No files uploaded yet in this project.';

  let fileContentsBlock = '';
  if (context.matchedFiles.length > 0) {
    const fileSnippets = context.matchedFiles
      .map((f) => {
        const lang = f.language || 'text';
        return `#### File: ${f.path}
\`\`\`${lang}
${f.content}
\`\`\``;
      })
      .join('\n\n');

    fileContentsBlock = `### Relevant Codebase Files (${
      context.retrievalStrategy === 'filename_match' ? 'Matched by Query' : 'Key Project Files'
    }):
${fileSnippets}`;
  }

  return `${CHAT_SYSTEM_PROMPT}

--- CODEBASE CONTEXT ---
Project: ${context.projectName || 'Active Project'}
${context.projectDescription ? `Description: ${context.projectDescription}\n` : ''}
${fileListBlock}

${fileContentsBlock}
--- END OF CODEBASE CONTEXT ---`;
}
