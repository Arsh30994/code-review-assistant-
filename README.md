# 🤖 AI Code Review Assistant

A full-stack, production-ready AI Code Review and Pair Programming Assistant built with **NestJS**, **Next.js 14 (App Router)**, **PostgreSQL**, **Prisma ORM**, and **Tailwind CSS**.

Supports OpenAI, LM Studio, and Ollama via OpenAI-compatible endpoints with lightweight RAG code retrieval, automated multi-mode audits, and an interactive developer workspace.

---

## 🌟 Key Features

- 🔐 **Authentication & Security**: JWT-based authentication with bcrypt password hashing, `@Public()` route guards, and secure `httpOnly` cookie handling.
- 📁 **Project & Code Management**: Multi-project workspaces with multipart file uploads, automated SHA-256 deduplication, language inference for 50+ extensions, and recursive file tree explorer.
- 🔍 **Multi-Mode AI Code Reviews**:
  - 🛡️ **Security Audit**: Scans for secrets/credentials leaks, IDOR, SQL/Command/XSS injection, and OWASP Top 10 vulnerabilities.
  - ⚡ **Performance Audit**: Detects N+1 queries, algorithmic bottlenecks, memory leaks, blocking I/O, and missing caching.
  - 💎 **Code Quality & Architecture**: Evaluates SOLID principles, clean code structure, naming conventions, DRY, and maintainability.
  - 🎯 **Flexible Scope**: Audit an entire project, multiple files, or a single targeted file.
- 📊 **Structured Insights & Health Scores**: Automated score computation (0–100), severity breakdown (Critical, High, Medium, Low), line-by-line issue locations, and actionable remediation recommendations.
- 💬 **AI Pair Programmer Chat (Heuristic RAG)**: Codebase-grounded chat assistant that automatically retrieves relevant source code, file structures, and entrypoints based on query context.
- 🔌 **Universal AI Provider Layer**: Pluggable OpenAI SDK client supporting cloud providers (**OpenAI**) and local offline LLMs (**LM Studio**, **Ollama**) with automatic database and environment fallback.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons |
| **Backend** | NestJS 10, TypeScript, Passport JWT, Multer, Helmet, Throttler |
| **Database & ORM** | PostgreSQL, Prisma ORM 5 |
| **AI Layer** | OpenAI Node.js SDK (OpenAI, LM Studio, Ollama) |

---

## 🏗️ Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│               Next.js 14 App Router (Frontend)         │
│   /login  •  /signup  •  /projects  •  /projects/[id]  │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP (REST + JWT Cookies)
┌───────────────────────────▼────────────────────────────┐
│                    NestJS API (Backend)                │
│   AuthModule   •   ProjectsModule   •   FilesModule    │
│   ReviewsModule (AI Engine)  •  ChatModule (RAG)       │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
      Prisma ORM (PostgreSQL)      AI Provider Service
               │                          │
      ┌────────▼────────┐        ┌────────▼────────┐
      │   PostgreSQL    │        │  OpenAI /       │
      │   Database      │        │  LM Studio /    │
      │                 │        │  Ollama         │
      └─────────────────┘        └─────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.x` or `v20.x`
- **npm** or **pnpm** / **yarn**
- **PostgreSQL**: Running locally or via Docker/cloud database (Supabase, Neon, AWS RDS)
- *(Optional)* **Ollama** or **LM Studio** for offline local AI execution

---

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd ai-code-review-backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

#### Run Database Migrations & Generate Prisma Client

```bash
# Apply migrations to PostgreSQL
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to inspect data
npx prisma studio
```

#### Start the Backend Server

```bash
# Development mode with hot reload
npm run start:dev
```

The NestJS backend runs on **`http://localhost:3000`** with global prefix `/api/v1`.

---

### 2. Frontend Setup

```bash
# Navigate to the frontend directory
cd ../ai-code-review-frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.local.example .env.local
```

#### Start the Frontend Server

```bash
# Development server
npm run dev
```

The Next.js frontend runs on **`http://localhost:3001`**.

---

## ⚙️ Environment Variables

### Backend (`ai-code-review-backend/.env`)

| Variable | Description | Default / Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/ai_code_review?schema=public` |
| `JWT_SECRET` | Secret key for signing access tokens | `your-long-random-secret-key` |
| `JWT_EXPIRES_IN` | Token expiration time | `7d` |
| `PORT` | API server port | `3000` |
| `NODE_ENV` | Runtime environment | `development` |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins | `http://localhost:3001,http://localhost:5173` |
| `MAX_FILE_SIZE_MB` | Max file upload limit in megabytes | `5` |
| `AI_PROVIDER` | Fallback AI provider type (`openai`, `lmstudio`, `ollama`) | `openai` |
| `AI_BASE_URL` | AI API endpoint URL | `https://api.openai.com/v1` |
| `AI_API_KEY` | AI API Key (required for OpenAI, placeholder for local) | `sk-proj-...` |
| `AI_MODEL` | Default AI model identifier | `gpt-4o` *(or `llama3` for Ollama)* |

### Frontend (`ai-code-review-frontend/.env.local`)

| Variable | Description | Default / Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000/api/v1` |

---

## 🗄️ Database Management (Prisma)

Common Prisma commands for schema modifications:

```bash
# Create and apply a new migration after schema changes
npx prisma migrate dev --name <migration_name>

# Regenerate Prisma Client types
npx prisma generate

# Push schema directly to database (prototyping)
npx prisma db push

# Launch visual database GUI
npx prisma studio
```

---

## 📡 REST API Reference

### Authentication
- `POST /api/v1/auth/register` — Register a new account (`email`, `password`, `name`)
- `POST /api/v1/auth/login` — Sign in and receive JWT token (`email`, `password`)
- `POST /api/v1/auth/logout` — Logout user

### Projects
- `GET /api/v1/projects` — List projects owned by authenticated user
- `POST /api/v1/projects` — Create a project (`name`, `description?`, `repoUrl?`, `language?`)
- `GET /api/v1/projects/:id` — Get project details with file metadata
- `PATCH /api/v1/projects/:id` — Update project metadata
- `DELETE /api/v1/projects/:id` — Delete project (cascades to files and reviews)

### Files
- `POST /api/v1/projects/:projectId/files` — Upload files (`multipart/form-data`)
- `GET /api/v1/files/:id` — Fetch file content and metadata

### AI Reviews
- `POST /api/v1/reviews` — Trigger AI review (`projectId`, `mode`, `scope`, `fileIds?`)
- `GET /api/v1/projects/:projectId/reviews` — List reviews for a project
- `GET /api/v1/reviews/:id` — Get full review analysis (summary, issues JSON, recommendations)
- `GET /api/v1/reviews?query=...` — Search reviews by keyword or mode

### AI Chat (RAG)
- `POST /api/v1/chat/sessions` — Create a chat session (`projectId?`, `title?`)
- `GET /api/v1/chat/sessions` — List user chat sessions
- `GET /api/v1/chat/sessions/:sessionId/messages` — Get session message history
- `POST /api/v1/chat/sessions/:sessionId/messages` — Send message with heuristic code context

---

## 🔒 Local LLM Setup (Ollama / LM Studio)

### Using Ollama
1. Download and install [Ollama](https://ollama.com).
2. Pull your model:
   ```bash
   ollama pull llama3
   ```
3. Set your backend `.env`:
   ```env
   AI_PROVIDER=ollama
   AI_BASE_URL=http://localhost:11434/v1
   AI_API_KEY=ollama
   AI_MODEL=llama3
   ```

### Using LM Studio
1. Open LM Studio and start the **Local Server** on port `1234`.
2. Load any GGUF model.
3. Set your backend `.env`:
   ```env
   AI_PROVIDER=lmstudio
   AI_BASE_URL=http://localhost:1234/v1
   AI_API_KEY=lm-studio
   AI_MODEL=local-model
   ```

---

## 📜 License

MIT License. Free for commercial and private use.
