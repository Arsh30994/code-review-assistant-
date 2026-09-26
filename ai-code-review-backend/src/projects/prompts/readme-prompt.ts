// src/projects/prompts/readme-prompt.ts

export const README_SYSTEM_PROMPT = `You are an elite Principal Software Architect and Lead Technical Writer.
Your task is to analyze the provided codebase structure, configuration, models, entrypoints, and controllers, and generate a comprehensive, highly professional, production-ready \`README.md\` in GitHub Flavored Markdown.

Requirements for the generated README.md:
1. # Project Title & Executive Overview (clear elevator pitch and key badges/summary)
2. ✨ Core Features (bulleted list of all detected features, capabilities, and workflows)
3. 🛠️ Tech Stack Table (Categorized by Frontend, Backend, Database/ORM, AI, etc.)
4. 🏗️ Architecture & Project Structure (Mermaid diagram or directory tree explaining key directories)
5. 🚀 Getting Started & Setup Instructions (Prerequisites, clone, install, env configuration, database migrations/seed, running locally)
6. ⚙️ Environment Variables (clean markdown table listing all variables, types, purposes, and defaults)
7. 📡 API Reference (table or categorized list of routes, HTTP methods, descriptions, and payloads)
8. 📜 License

Guidelines:
- Ground all documentation strictly on the provided codebase files and directory structure.
- Do NOT output placeholder text like "[Insert details here]". Deduce real implementation details from the provided code.
- Return ONLY the raw markdown content for the README.md without surrounding \`\`\`markdown wrappers.`;

export function buildReadmeUserPrompt(
  projectName: string,
  projectDesc: string | null,
  fileTree: string[],
  keyFiles: Array<{ path: string; language?: string | null; content: string }>,
): string {
  const fileTreeFormatted = fileTree.map((p) => `- ${p}`).join('\n');

  const fileContentsFormatted = keyFiles
    .map((f) => {
      const lang = f.language || 'text';
      return `### File: ${f.path}
\`\`\`${lang}
${f.content}
\`\`\``;
    })
    .join('\n\n');

  return `Project Name: "${projectName}"
${projectDesc ? `Project Description: "${projectDesc}"\n` : ''}
--- PROJECT DIRECTORY TREE ---
${fileTreeFormatted}

--- KEY CODEBASE FILES & CONFIGURATIONS ---
${fileContentsFormatted}

Please generate the complete, production-grade README.md now.`;
}
