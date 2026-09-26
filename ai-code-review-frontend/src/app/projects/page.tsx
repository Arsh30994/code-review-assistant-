// src/app/projects/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Code,
  FileCode,
  FolderGit2,
  GitBranch,
  Loader2,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Project } from '@/lib/types';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Project Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectLanguage, setProjectLanguage] = useState('typescript');
  const [projectRepo, setProjectRepo] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await apiClient<Project[]>('/projects');
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    try {
      const newProject = await apiClient<Project>('/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: projectName,
          description: projectDesc || undefined,
          language: projectLanguage || undefined,
          repoUrl: projectRepo || undefined,
        }),
      });

      setProjects((prev) => [newProject, ...prev]);
      setIsModalOpen(false);
      setProjectName('');
      setProjectDesc('');
      setProjectRepo('');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create project');
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Projects</h1>
          <p className="text-sm text-gray-400 mt-1">Manage and run AI reviews on your codebases</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition shadow-lg shadow-primary-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-surface border border-border text-sm text-white focus:border-primary-500 outline-none transition"
          />
        </div>

        <div className="text-xs text-gray-400">
          Total Projects: <span className="text-white font-medium">{projects.length}</span>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <p className="text-sm">Loading projects...</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Projects Grid */}
      {!loading && !error && (
        <>
          {filteredProjects.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-border rounded-xl bg-surface/30">
              <FolderGit2 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-base font-medium text-white mb-1">No projects found</h3>
              <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6">
                Get started by creating your first project and uploading source code files.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create Project</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group bg-surface hover:bg-surface-hover border border-border hover:border-primary-500/40 rounded-xl p-5 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-primary-600/5"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2.5 rounded-lg bg-primary-600/10 border border-primary-500/20 text-primary-400 group-hover:text-primary-300">
                        <FolderGit2 className="w-5 h-5" />
                      </div>
                      {project.language && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-background border border-border text-gray-400 uppercase">
                          {project.language}
                        </span>
                      )}
                    </div>

                    <h2 className="text-base font-semibold text-white group-hover:text-primary-400 transition-colors tracking-tight">
                      {project.name}
                    </h2>

                    <p className="text-xs text-gray-400 mt-1 line-clamp-2 min-h-[32px]">
                      {project.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center space-x-1">
                        <FileCode className="w-3.5 h-3.5" />
                        <span>{project._count?.files ?? 0} files</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{project._count?.reviews ?? 0} reviews</span>
                      </span>
                    </div>

                    <span className="text-[11px]">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-surface border border-border rounded-xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-6">
              <div className="p-2 rounded-lg bg-primary-600/10 border border-primary-500/20">
                <FolderGit2 className="w-5 h-5 text-primary-500" />
              </div>
              <h2 className="text-lg font-bold text-white">Create New Project</h2>
            </div>

            {createError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5 uppercase">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., ai-code-review-assistant"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-background border border-border text-sm text-white focus:border-primary-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5 uppercase">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of what this project does..."
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-background border border-border text-sm text-white focus:border-primary-500 outline-none transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5 uppercase">
                    Primary Language
                  </label>
                  <select
                    value={projectLanguage}
                    onChange={(e) => setProjectLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-white focus:border-primary-500 outline-none transition"
                  >
                    <option value="typescript">TypeScript</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                    <option value="java">Java</option>
                    <option value="csharp">C#</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5 uppercase">
                    Repo URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={projectRepo}
                    onChange={(e) => setProjectRepo(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-background border border-border text-sm text-white focus:border-primary-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-surface-hover transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition flex items-center space-x-2"
                >
                  {createLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Project</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
