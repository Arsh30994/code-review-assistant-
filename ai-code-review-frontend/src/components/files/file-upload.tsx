// src/components/files/file-upload.tsx
'use client';

import { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileCode,
  Loader2,
  UploadCloud,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface FileUploadProps {
  projectId: string;
  onUploadSuccess: () => void;
}

export function FileUpload({ projectId, onUploadSuccess }: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (filesList: FileList | null) => {
    if (!filesList) return;
    const newFiles = Array.from(filesList);
    setSelectedFiles((prev) => [...prev, ...newFiles]);
    setError(null);
    setSuccess(false);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      await apiClient(`/projects/${projectId}/files`, {
        method: 'POST',
        body: formData,
      });

      setSuccess(true);
      setSelectedFiles([]);
      onUploadSuccess();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please check file sizes and formats.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white tracking-tight">Upload Code Files</h3>
        <span className="text-xs text-gray-400">Max 5MB per file</span>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Files uploaded and indexed successfully!</span>
        </div>
      )}

      {/* Drag & Drop Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-primary-500 bg-primary-600/10'
            : 'border-border hover:border-primary-500/50 hover:bg-surface-hover/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileChange(e.target.files)}
          className="hidden"
        />

        <UploadCloud className="w-8 h-8 text-primary-400 mx-auto mb-2" />
        <p className="text-xs font-medium text-gray-200">
          Click to browse or drag & drop files here
        </p>
        <p className="text-[11px] text-gray-500 mt-1">
          Supports .ts, .tsx, .js, .py, .go, .rs, .json, .prisma, Dockerfile, etc.
        </p>
      </div>

      {/* Staged Files Preview List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-300">
            Selected Files ({selectedFiles.length}):
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-background border border-border text-xs"
              >
                <div className="flex items-center space-x-2 truncate">
                  <FileCode className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                  <span className="text-gray-200 truncate">{file.name}</span>
                  <span className="text-gray-500 text-[11px]">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="text-gray-500 hover:text-red-400 p-0.5 rounded transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition flex items-center space-x-2 shadow-md shadow-primary-600/20"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading {selectedFiles.length} file(s)...</span>
                </>
              ) : (
                <span>Submit & Upload</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
