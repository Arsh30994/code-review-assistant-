// src/components/projects/readme-dialog.tsx
'use client';

import { useState } from 'react';
import {
  AlertCircle,
  Check,
  Code2,
  Copy,
  Download,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';

interface ReadmeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  readme: string | null;
  loading: boolean;
  error: string | null;
  projectName: string;
  onRegenerate: () => void;
}

export function ReadmeDialog({
  isOpen,
  onClose,
  readme,
  loading,
  error,
  projectName,
  onRegenerate,
}: ReadmeDialogProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!readme) return;
    try {
      await navigator.clipboard.writeText(readme);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleDownload = () => {
    if (!readme) return;
    const blob = new Blob([readme], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'README.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl bg-[#12141c] border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-[#161922]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary-500/10 border border-primary-500/20 text-primary-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">Generated README.md</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary-500/10 text-primary-400 border border-primary-500/20 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Generated
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Project documentation for <span className="text-gray-200 font-medium">{projectName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {readme && !loading && (
              <>
                {/* View Mode Toggle */}
                <div className="flex items-center bg-background border border-border rounded-lg p-0.5 text-xs">
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md transition font-medium ${
                      viewMode === 'preview'
                        ? 'bg-surface text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Formatted</span>
                  </button>
                  <button
                    onClick={() => setViewMode('raw')}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md transition font-medium ${
                      viewMode === 'raw'
                        ? 'bg-surface text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Raw Markdown</span>
                  </button>
                </div>

                {/* Copy Button */}
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-border text-xs font-semibold text-gray-200 hover:text-white transition"
                  title="Copy markdown to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                {/* Download Button */}
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-xs font-semibold text-white transition shadow-sm"
                  title="Download README.md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .md</span>
                </button>

                {/* Regenerate Button */}
                <button
                  onClick={onRegenerate}
                  className="p-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-border text-gray-400 hover:text-white transition"
                  title="Regenerate README"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0d0f14]">
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-primary-500/20 border-t-primary-500 animate-spin" />
                <Sparkles className="w-5 h-5 text-primary-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">Analyzing Codebase & Writing README...</h3>
                <p className="text-xs text-gray-400 max-w-sm">
                  Extracting dependencies, endpoints, architecture, and setup instructions from your files.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 text-center">
              <AlertCircle className="w-10 h-10 text-red-400" />
              <h3 className="text-sm font-bold text-white">Failed to Generate README</h3>
              <p className="text-xs text-gray-400 max-w-md">{error}</p>
              <button
                onClick={onRegenerate}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
            </div>
          ) : readme ? (
            <div>
              {viewMode === 'raw' ? (
                <pre className="p-4 rounded-xl bg-[#12141c] border border-border text-gray-300 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap select-text">
                  {readme}
                </pre>
              ) : (
                <div className="p-6 rounded-xl bg-[#12141c] border border-border text-gray-200 text-sm leading-relaxed space-y-4 prose prose-invert max-w-none">
                  <MarkdownRenderer content={readme} />
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-[#161922] text-xs text-gray-400">
          <div className="flex items-center space-x-2">
            <span>Status:</span>
            {loading ? (
              <span className="text-amber-400 flex items-center space-x-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Generating</span>
              </span>
            ) : error ? (
              <span className="text-red-400">Error</span>
            ) : (
              <span className="text-emerald-400 flex items-center space-x-1">
                <Check className="w-3 h-3" />
                <span>Ready</span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-border text-gray-300 hover:text-white font-medium transition text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Lightweight native Markdown formatting component
 */
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="space-y-3 font-sans text-xs sm:text-sm text-gray-300">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={idx} className="text-2xl font-bold text-white border-b border-border pb-2 pt-4">
              {trimmed.replace(/^#\s+/, '')}
            </h1>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-lg font-bold text-white border-b border-border/50 pb-1.5 pt-3">
              {trimmed.replace(/^##\s+/, '')}
            </h2>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-sm font-semibold text-primary-300 pt-2">
              {trimmed.replace(/^###\s+/, '')}
            </h3>
          );
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <li key={idx} className="ml-5 list-disc text-gray-300">
              {renderInlineTokens(trimmed.replace(/^[-*]\s+/, ''))}
            </li>
          );
        }
        if (trimmed.startsWith('```')) {
          return (
            <div key={idx} className="my-1 font-mono text-xs text-primary-400 bg-background/50 px-2 py-0.5 rounded border border-border/40 inline-block">
              {trimmed}
            </div>
          );
        }
        if (trimmed === '') {
          return <div key={idx} className="h-1.5" />;
        }

        return (
          <p key={idx} className="text-gray-300 leading-relaxed">
            {renderInlineTokens(line)}
          </p>
        );
      })}
    </div>
  );
}

function renderInlineTokens(text: string) {
  // Simple token parser for `code` and **bold**
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-background border border-border/60 text-primary-300 font-mono text-xs">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
