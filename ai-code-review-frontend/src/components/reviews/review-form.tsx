// src/components/reviews/review-form.tsx
'use client';

import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileCode,
  Gauge,
  Loader2,
  ShieldAlert,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { ProjectFile, Review } from '@/lib/types';

interface ReviewFormProps {
  projectId: string;
  files: ProjectFile[];
  isOpen: boolean;
  onClose: () => void;
  onReviewCreated: (review: Review) => void;
}

export function ReviewForm({
  projectId,
  files,
  isOpen,
  onClose,
  onReviewCreated,
}: ReviewFormProps) {
  const [mode, setMode] = useState<'security' | 'performance' | 'quality'>('quality');
  const [scope, setScope] = useState<'project' | 'files' | 'file'>('project');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [fileFilter, setFileFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleFile = (fileId: string) => {
    if (scope === 'file') {
      setSelectedFileIds([fileId]);
    } else {
      setSelectedFileIds((prev) =>
        prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId],
      );
    }
  };

  const handleSelectAll = () => {
    setSelectedFileIds(files.map((f) => f.id));
  };

  const handleClearAll = () => {
    setSelectedFileIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (scope === 'file' && selectedFileIds.length === 0) {
      setError('Please select a file to review.');
      return;
    }

    if (scope === 'files' && selectedFileIds.length === 0) {
      setError('Please select at least one file to review.');
      return;
    }

    setLoading(true);

    try {
      const review = await apiClient<Review>('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          projectId,
          mode,
          scope,
          fileIds: scope !== 'project' ? selectedFileIds : undefined,
        }),
      });

      onReviewCreated(review);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to execute code review.');
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = files.filter((f) =>
    f.path.toLowerCase().includes(fileFilter.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-surface border border-border rounded-xl p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 text-gray-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5 mb-6">
          <div className="p-2.5 rounded-xl bg-primary-600/10 border border-primary-500/20">
            <Sparkles className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Run New AI Code Review</h2>
            <p className="text-xs text-gray-400">
              Configure audit mode, review scope, and target files
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mode Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
              1. Review Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Quality */}
              <button
                type="button"
                onClick={() => setMode('quality')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  mode === 'quality'
                    ? 'border-primary-500 bg-primary-600/10 shadow-md shadow-primary-600/10'
                    : 'border-border bg-background/50 hover:bg-background hover:border-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <CheckCircle2 className={`w-4 h-4 ${mode === 'quality' ? 'text-primary-400' : 'text-gray-400'}`} />
                  <span className="text-xs font-bold text-white">Code Quality</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-normal">
                  SOLID, naming, clean code, DRY, maintainability & design patterns.
                </p>
              </button>

              {/* Security */}
              <button
                type="button"
                onClick={() => setMode('security')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  mode === 'security'
                    ? 'border-red-500 bg-red-600/10 shadow-md shadow-red-600/10'
                    : 'border-border bg-background/50 hover:bg-background hover:border-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <ShieldAlert className={`w-4 h-4 ${mode === 'security' ? 'text-red-400' : 'text-gray-400'}`} />
                  <span className="text-xs font-bold text-white">Security Audit</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-normal">
                  Secrets leak, auth bypass, injection, OWASP Top 10 vulnerabilities.
                </p>
              </button>

              {/* Performance */}
              <button
                type="button"
                onClick={() => setMode('performance')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  mode === 'performance'
                    ? 'border-amber-500 bg-amber-600/10 shadow-md shadow-amber-600/10'
                    : 'border-border bg-background/50 hover:bg-background hover:border-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <Zap className={`w-4 h-4 ${mode === 'performance' ? 'text-amber-400' : 'text-gray-400'}`} />
                  <span className="text-xs font-bold text-white">Performance</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-normal">
                  N+1 queries, heavy loops, memory leaks, blocking I/O, bottlenecks.
                </p>
              </button>
            </div>
          </div>

          {/* Scope Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
              2. Analysis Scope
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'project', label: 'Entire Project', sub: `All ${files.length} files` },
                { id: 'files', label: 'Multiple Files', sub: 'Selected files subset' },
                { id: 'file', label: 'Single File', sub: 'Deep dive 1 file' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setScope(s.id as any);
                    if (s.id === 'file' && selectedFileIds.length > 1) {
                      setSelectedFileIds([selectedFileIds[0]]);
                    }
                  }}
                  className={`p-3 rounded-lg border text-center transition ${
                    scope === s.id
                      ? 'border-primary-500 bg-primary-600/10 text-white font-medium'
                      : 'border-border bg-background/50 text-gray-400 hover:text-white hover:bg-background'
                  }`}
                >
                  <div className="text-xs font-semibold">{s.label}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{s.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Target Files Selector (when scope is file or files) */}
          {scope !== 'project' && (
            <div className="space-y-2 border border-border rounded-xl p-4 bg-background/40">
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className="text-xs font-semibold text-gray-300 uppercase">
                  {scope === 'file' ? 'Select 1 File' : `Select Files (${selectedFileIds.length} chosen)`}
                </label>

                {scope === 'files' && (
                  <div className="flex items-center space-x-2 text-xs">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-primary-400 hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-gray-600">•</span>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-gray-400 hover:text-white hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              <input
                type="text"
                placeholder="Filter files by name..."
                value={fileFilter}
                onChange={(e) => setFileFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface border border-border text-white outline-none focus:border-primary-500 mb-2"
              />

              <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-border/40">
                {filteredFiles.map((file) => {
                  const isChecked = selectedFileIds.includes(file.id);
                  return (
                    <div
                      key={file.id}
                      onClick={() => toggleFile(file.id)}
                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer text-xs transition ${
                        isChecked
                          ? 'bg-primary-600/15 text-white font-medium'
                          : 'text-gray-400 hover:bg-surface-hover/60 hover:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <input
                          type={scope === 'file' ? 'radio' : 'checkbox'}
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-border text-primary-600 focus:ring-0"
                        />
                        <FileCode className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                        <span className="font-mono truncate">{file.path}</span>
                      </div>
                      <span className="text-[10px] text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white rounded-lg transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || files.length === 0}
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition flex items-center space-x-2 shadow-lg shadow-primary-600/25"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing Codebase ({mode.toUpperCase()})...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Start Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
