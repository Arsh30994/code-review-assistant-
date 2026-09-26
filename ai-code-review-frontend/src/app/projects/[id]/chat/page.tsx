// src/app/projects/[id]/chat/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  FileCode,
  FolderGit2,
  GitBranch,
  Loader2,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Project, ProjectFile } from '@/lib/types';
import { FileTree } from '@/components/files/file-tree';
import { ChatPanel } from '@/components/chat/chat-panel';

export default function ProjectChatPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);

  const loadProject = async () => {
    try {
      setLoading(true);
      const data = await apiClient<Project>(`/projects/${projectId}`);
      setProject(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const handleSelectFile = (file: ProjectFile) => {
    setSelectedFile(file);
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        <p className="text-sm">Connecting to AI Codebase Chat...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 rounded-xl bg-surface border border-border text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white mb-1">Project Not Found</h2>
        <p className="text-sm text-gray-400 mb-6">{error || 'Could not load project context.'}</p>
        <Link
          href="/projects"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center space-x-3">
          <Link
            href={`/projects/${project.id}`}
            className="p-2 rounded-lg bg-surface hover:bg-surface-hover border border-border text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white tracking-tight">{project.name}</h1>
              {project.language && (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface border border-border text-primary-400">
                  {project.language}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">AI Codebase Assistant & Pair Programmer</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <Link
            href={`/projects/${project.id}`}
            className="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-border text-gray-300 hover:text-white transition flex items-center space-x-1.5"
          >
            <FileCode className="w-3.5 h-3.5 text-primary-400" />
            <span>Files & Reviews</span>
          </Link>
        </div>
      </div>

      {/* Main 2-Column Chat Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: File Tree Explorer */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-2">
              <div className="flex items-center space-x-2">
                <FolderGit2 className="w-4 h-4 text-primary-400" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  Indexed Files ({project.files?.length ?? 0})
                </span>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
              These files are loaded into context during conversations. Click any file to view name details.
            </p>

            <FileTree
              files={project.files || []}
              selectedFileId={selectedFile?.id}
              onSelectFile={handleSelectFile}
            />
          </div>

          {selectedFile && (
            <div className="bg-surface border border-border rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Selected File:</span>
                <span className="text-gray-400">{(selectedFile.size / 1024).toFixed(1)} KB</span>
              </div>
              <div className="font-mono text-primary-400 truncate bg-background p-2 rounded border border-border">
                {selectedFile.path}
              </div>
              <p className="text-[11px] text-gray-400">
                Mention <code className="text-white font-mono bg-background px-1 py-0.5 rounded">{selectedFile.path.split('/').pop()}</code> in chat to target this file.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Chat Panel */}
        <div className="lg:col-span-8">
          <ChatPanel project={project} />
        </div>
      </div>
    </div>
  );
}
