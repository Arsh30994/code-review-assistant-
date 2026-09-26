// src/components/files/file-preview.tsx
'use client';

import { useState } from 'react';
import { Check, Copy, FileCode, FlaskConical } from 'lucide-react';
import { ProjectFile } from '@/lib/types';
import { apiClient } from '@/lib/api';
import {
  GenerateTestsDialog,
  GenerateTestsResult,
} from './generate-tests-dialog';

interface FilePreviewProps {
  file: ProjectFile | null;
  projectId: string;
}

export function inferLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    json: 'json',
    prisma: 'prisma',
    html: 'html',
    css: 'css',
    scss: 'scss',
    sql: 'sql',
    sh: 'bash',
    bash: 'bash',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    go: 'go',
    rs: 'rust',
    java: 'java',
    cs: 'csharp',
    cpp: 'cpp',
    c: 'c',
    dockerfile: 'dockerfile',
  };

  return ext && map[ext] ? map[ext] : 'text';
}

/** Extensions where test generation is not useful */
const UNTESTABLE_EXTS = new Set([
  'json', 'yaml', 'yml', 'toml', 'xml', 'csv', 'md', 'mdx', 'txt',
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf',
]);

export function FilePreview({ file, projectId }: FilePreviewProps) {
  const [copied, setCopied] = useState(false);

  // Generate-tests state
  const [testsDialogOpen, setTestsDialogOpen] = useState(false);
  const [testsResult, setTestsResult] = useState<GenerateTestsResult | null>(null);
  const [testsLoading, setTestsLoading] = useState(false);
  const [testsError, setTestsError] = useState<string | null>(null);

  if (!file) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-surface/40 border border-border rounded-xl">
        <FileCode className="w-12 h-12 text-gray-600 mb-3" />
        <h3 className="text-sm font-medium text-gray-300 mb-1">No file selected</h3>
        <p className="text-xs text-gray-500 max-w-xs">
          Select a file from the explorer on the left to view its contents.
        </p>
      </div>
    );
  }

  const content = file.content || '';
  const lines = content.split('\n');
  const language = inferLanguage(file.path);
  const ext = file.path.split('.').pop()?.toLowerCase() ?? '';
  const canGenerateTests = !UNTESTABLE_EXTS.has(ext);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateTests = async () => {
    setTestsDialogOpen(true);
    setTestsLoading(true);
    setTestsError(null);
    try {
      const res = await apiClient<GenerateTestsResult>(
        `/projects/${projectId}/files/${file.id}/generate-tests`,
        { method: 'POST' },
      );
      setTestsResult(res);
    } catch (err: any) {
      setTestsError(err.message || 'Failed to generate tests');
    } finally {
      setTestsLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col h-full bg-surface border border-border rounded-xl overflow-hidden shadow-lg">
        {/* File Header Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-background/80 border-b border-border text-xs">
          <div className="flex items-center space-x-2.5 truncate min-w-0">
            <FileCode className="w-4 h-4 text-primary-400 flex-shrink-0" />
            <span className="font-mono text-gray-200 truncate">{file.path}</span>
            <span className="px-2 py-0.5 rounded bg-surface border border-border text-[10px] text-gray-400 uppercase font-mono flex-shrink-0">
              {language}
            </span>
            <span className="text-gray-500 text-[11px] flex-shrink-0">
              {lines.length} lines • {(file.size / 1024).toFixed(1)} KB
            </span>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
            {/* Generate Tests button */}
            {canGenerateTests && (
              <button
                onClick={handleGenerateTests}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 transition"
                title="Generate unit tests for this file with AI"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold">Generate Tests</span>
              </button>
            )}

            {/* Copy source */}
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-surface hover:bg-surface-hover border border-border text-gray-300 hover:text-white transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[11px]">Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code Viewer */}
        <div className="flex-1 overflow-auto bg-[#0d1117] font-mono text-xs text-gray-200 p-4 leading-relaxed">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="w-10 pr-4 text-right text-gray-600 select-none align-top font-mono text-[11px]">
                    {idx + 1}
                  </td>
                  <td className="whitespace-pre overflow-x-auto text-gray-200 font-mono">
                    {line || ' '}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Tests Dialog */}
      <GenerateTestsDialog
        isOpen={testsDialogOpen}
        onClose={() => setTestsDialogOpen(false)}
        result={testsResult}
        loading={testsLoading}
        error={testsError}
        filePath={file.path}
        onRegenerate={handleGenerateTests}
      />
    </>
  );
}

