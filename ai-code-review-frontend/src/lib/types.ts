// src/lib/types.ts

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'DEVELOPER' | 'VIEWER';
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  repoUrl?: string | null;
  language?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    files: number;
    reviews: number;
  };
  files?: ProjectFile[];
}

export interface ProjectFile {
  id: string;
  path: string;
  language?: string | null;
  size: number;
  content?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewIssue {
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
  file: string;
  line?: number | null;
}

export interface Review {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  mode: 'security' | 'performance' | 'quality';
  scope: 'file' | 'files' | 'project';
  targetFileIds: string[];
  summary: string;
  summaryPreview?: string;
  recommendations: string;
  issues: ReviewIssue[];
  score?: number | null;
  tokensUsed?: number | null;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string };
  provider?: { name: string; model: string };
  file?: { id: string; path: string };
}

export interface ChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM' | 'user' | 'assistant' | 'system';
  content: string;
  tokensUsed?: number | null;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  title?: string | null;
  projectId?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
  _count?: {
    messages: number;
  };
}

