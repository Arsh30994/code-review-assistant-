# 🤖 AI Usage & Engineering Decisions Report

This document transparently outlines the AI methodologies, toolchains, representative prompts, code provenance breakdown, and architectural trade-offs made during the development of the **AI Code Review Assistant**.

---

## 1. AI Tools & Environments Used

- **Google Antigravity IDE / Advanced Agentic Coding**: Autonomous pair programming agent used for scaffold synthesis, multi-file refactoring, type checking, and test validation.
- **Anthropic Claude 3.5 Sonnet & Claude 3.7 Sonnet**: Primary LLM models used for architecture synthesis, TypeScript types generation, and system prompt engineering.
- **Google Gemini 1.5 Pro / 2.0 Flash**: Multi-step verification, prompt optimization, and schema consistency audits.

---

## 2. Representative Prompts & System Instructions

### A. Scaffolding NestJS Modules & Prisma Schema
> *"You are a senior NestJS + Prisma architect. Create a production-grade backend scaffold for an AI Code Review Assistant. Define a complete Prisma schema with User, Project, File, Review, ChatSession, Message, and AIProvider models using UUIDs, Text columns for large code blocks, and JSON fields for structured issues. Wire up AuthModule, ProjectsModule, FilesModule, ReviewsModule, ChatModule, and AIModule with a singleton PrismaService wrapper."*

### B. Generating Multi-Mode Review Prompts (Security, Performance, Quality)
> *"Design comprehensive system prompts for three distinct code review modes: Security, Performance, and Code Quality.
> 1. Security: Scrutinize credentials exposure, JWT/auth flaws, SQL/Command/XSS injection, and OWASP Top 10 vulnerabilities.
> 2. Performance: Scrutinize N+1 queries, algorithmic complexity (O(n^2)), blocking synchronous I/O, memory leaks, and caching.
> 3. Quality: Evaluate SOLID principles, clean code patterns, naming, DRY, and maintainability.
> Enforce a strict JSON output schema: { summary: string, issues: [{ severity: 'Critical'|'High'|'Medium'|'Low', title: string, description: string, file: string, line: number|null }], recommendations: string } with zero markdown wrapping."*

### C. Lightweight RAG Context Retrieval & Chat-with-Code Prompts
> *"Implement a heuristic RAG prompt builder for codebases. If a user query mentions a specific file name or relative path, retrieve that file's full content. If no specific file is mentioned, inject a compact context including the complete directory tree and critical entrypoint files (package.json, schema.prisma, main.ts, Dockerfile). Cap total injected characters at 24,000 to prevent context overflow."*

### D. Frontend React Components (FileTree, ReviewForm, ChatPanel)
> *"Build accessible, dark-themed Next.js 14 App Router components in Tailwind CSS:
> 1. FileTree: A recursive folder/file tree that handles nested path strings (e.g. src/auth/jwt.strategy.ts), folder expand/collapse state, and file selection.
> 2. FilePreview: Line-numbered code viewer with copy buttons and language inference for 50+ file extensions.
> 3. ReviewForm & ReviewDetail: Modal to select review mode/scope and a structured results view with colored severity badges and health scores."*

---

## 3. Code Provenance Breakdown

| Module / Layer | AI-Generated / Scaffolded | Human-Curated & Refined | Description |
|---|:---:|:---:|---|
| **Prisma Schema & Migrations** | 80% | 20% | AI generated models and relations; manually refined cascade rules and unique constraints. |
| **Auth & Security Guarding** | 75% | 25% | AI drafted Passport strategies; manually configured global APP_GUARD and httpOnly cookie flow. |
| **AI Provider Abstraction** | 85% | 15% | AI created OpenAI SDK wrapper; manually refined timeout handling, model fallbacks, and local endpoint support. |
| **Review Engine & Prompts** | 80% | 20% | AI formulated prompt templates; manually tuned severity score deductions and JSON sanitization. |
| **Heuristic RAG Chat** | 70% | 30% | AI synthesized regex tokenizer; manually configured file priority rankings and context budget ceilings. |
| **Frontend UI & Components** | 85% | 15% | AI built Tailwind layouts and recursive FileTree; manually adjusted color contrast and responsiveness. |
| **Overall Project Codebase** | **~80%** | **~20%** | **High-velocity AI generation with rigorous human architectural direction.** |

---

## 4. Key Engineering Decisions & Rationale

### 1. NestJS + Prisma ORM + PostgreSQL
- **Why**: NestJS enforces an enterprise-grade Dependency Injection (DI) architecture with modular boundaries, making it straightforward to test and maintain. PostgreSQL provides reliable ACID compliance and relational integrity for users, projects, and review histories. Prisma ORM delivers end-to-end type safety from the database schema directly into TypeScript services.
- **Alternative Considered**: Express + TypeORM or Fastify + Knex. Prisma was chosen for its schema clarity and client generation.

### 2. Universal OpenAI-Compatible Provider Abstraction
- **Why**: OpenAI, LM Studio, Ollama, Groq, Together AI, and Azure OpenAI all standardize on the `/v1/chat/completions` API structure. By building a single `BaseOpenAICompatibleProvider` that configures `baseURL` and `apiKey` dynamically, the application seamlessly supports both cloud-hosted models (GPT-4o) and zero-cost local LLMs (Llama 3, Mistral) without rewriting prompt pipelines.
- **Alternative Considered**: Separate proprietary SDKs (e.g., LangChain or distinct Ollama/Anthropic SDKs). The unified OpenAI SDK approach eliminated unnecessary dependency bloat.

### 3. Heuristic Context Retrieval vs. Vector Embeddings (RAG)
- **Why**: For small-to-medium codebases, vector chunking with embedding models introduces significant complexity: indexing pipelines, external vector databases (Pinecone/pgvector), chunk boundary fragmentation, and embedding API costs. Heuristic retrieval (matching mentioned filenames + key architectural entrypoints) is instantaneous, 100% deterministic, requires zero external services, and provides superior holistic context for architectural questions.
- **Alternative Considered**: pgvector embeddings with semantic similarity. Heuristic RAG was chosen as the optimal balance of speed, cost, and developer experience.

---

## 5. Architectural Trade-offs & Limitations

| Decision | Benefits | Trade-offs & Mitigations |
|---|---|---|
| **Storing Code in PostgreSQL (`@db.Text`)** | Atomic project backups, zero external S3 bucket setup, instant cascade deletes. | DB table size grows with massive repositories. *Mitigation: `findAll` queries explicitly exclude file contents; max upload cap is enforced at 5MB per file.* |
| **Strict JSON Schema Review Output** | Machine-readable, structured UI tables, computable health scores. | LLMs can occasionally return invalid JSON. *Mitigation: Strips markdown code blocks, runs rigorous `JSON.parse` defensive try/catch, and falls back to text summaries if corrupted.* |
| **Synchronous Review Processing** | Immediate user feedback without standing up Redis / BullMQ worker nodes. | HTTP request timeout on extremely large files with slow local LLMs. *Mitigation: 120-second timeout configured on the OpenAI client; future roadmap includes background job queues.* |
| **Stateless JWTs + `httpOnly` Cookies** | High horizontal scalability, immune to client-side XSS token theft. | Token invalidation requires expiration or DB token blacklist table. *Mitigation: Configured 7-day token rotation and instant client-side cookie clearing on logout.* |

---

## 6. Summary

By leveraging AI as an accelerator for boilerplate synthesis, prompt engineering, and UI component creation while maintaining strict human oversight over security architecture, database relational constraints, and type integrity, this project achieved a production-grade implementation in record development time.
