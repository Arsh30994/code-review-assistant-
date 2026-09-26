// src/components/files/generate-tests-dialog.tsx
'use client';

import { useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  FlaskConical,
  Loader2,
  RefreshCw,
  Sparkles,
  Terminal,
  X,
} from 'lucide-react';

export interface GenerateTestsResult {
  tests: string;
  suggestedFilename: string;
  framework: string;
  runner: string;
}

interface GenerateTestsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  result: GenerateTestsResult | null;
  loading: boolean;
  error: string | null;
  filePath: string;
  onRegenerate: () => void;
}

export function GenerateTestsDialog({
  isOpen,
  onClose,
  result,
  loading,
  error,
  filePath,
  onRegenerate,
}: GenerateTestsDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.tests);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard write failed', err);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.tests], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', result.suggestedFilename.split('/').pop() ?? result.suggestedFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const lines = result?.tests.split('\n') ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl bg-[#12141c] border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-[#161922] flex-shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex-shrink-0">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h2 className="text-base font-bold text-white">Generated Unit Tests</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary-500/10 text-primary-400 border border-primary-500/20 flex items-center gap-1 flex-shrink-0">
                  <Sparkles className="w-3 h-3" />
                  AI Generated
                </span>
                {result && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                    {result.framework}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-mono truncate">{filePath}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
            {result && !loading && (
              <>
                <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-background border border-border text-[11px] font-mono text-gray-400">
                  <Terminal className="w-3 h-3 text-gray-500" />
                  <span>{result.runner}</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-border text-xs font-semibold text-gray-200 hover:text-white transition"
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
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={onRegenerate}
                  className="p-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-border text-gray-400 hover:text-white transition"
                  title="Regenerate tests"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Suggested filename banner */}
        {result && !loading && (
          <div className="flex items-center space-x-2 px-6 py-2 bg-emerald-500/5 border-b border-emerald-500/10 text-xs text-emerald-300 flex-shrink-0">
            <FlaskConical className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="text-gray-400">Save as:</span>
            <span className="font-mono text-emerald-300">{result.suggestedFilename}</span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-auto bg-[#0d1117]">
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                <FlaskConical className="w-5 h-5 text-emerald-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">Generating unit tests…</h3>
                <p className="text-xs text-gray-400 max-w-sm">
                  Analyzing source code, detecting patterns, and writing happy paths, edge cases, and mocks.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 text-center px-8">
              <AlertCircle className="w-10 h-10 text-red-400" />
              <h3 className="text-sm font-bold text-white">Failed to Generate Tests</h3>
              <p className="text-xs text-gray-400 max-w-md">{error}</p>
              <button
                onClick={onRegenerate}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
            </div>
          ) : result ? (
            <div className="font-mono text-xs text-gray-200 p-4 leading-relaxed">
              <table className="w-full border-collapse">
                <tbody>
                  {lines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="w-10 pr-4 text-right text-gray-600 select-none align-top text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="whitespace-pre overflow-x-auto text-gray-200">
                        {line || ' '}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-[#161922] text-xs text-gray-400 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <span>Status:</span>
            {loading ? (
              <span className="text-amber-400 flex items-center space-x-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Generating</span>
              </span>
            ) : error ? (
              <span className="text-red-400">Error</span>
            ) : result ? (
              <span className="text-emerald-400 flex items-center space-x-1">
                <Check className="w-3 h-3" />
                <span>{lines.length} lines generated</span>
              </span>
            ) : null}
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
