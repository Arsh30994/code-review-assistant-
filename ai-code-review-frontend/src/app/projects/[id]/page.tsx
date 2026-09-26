// src/app/projects/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  FileCode,
  FileText,
  FolderGit2,
  GitBranch,
  Loader2,
  Plus,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Project, ProjectFile, Review } from '@/lib/types';
import { FileTree } from '@/components/files/file-tree';
import { FilePreview } from '@/components/files/file-preview';
import { FileUpload } from '@/components/files/file-upload';
import { ReviewForm } from '@/components/reviews/review-form';
import { ReviewDetail } from '@/components/reviews/review-detail';
import { ReviewHistory } from '@/components/reviews/review-history';
import { ReadmeDialog } from '@/components/projects/readme-dialog';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [activeReview, setActiveReview] = useState<Review | null>(null);
  const [loadingReviewDetail, setLoadingReviewDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'reviews'>('files');

  // Modal States
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isReadmeModalOpen, setIsReadmeModalOpen] = useState(false);
  const [readmeContent, setReadmeContent] = useState<string | null>(null);
  const [generatingReadme, setGeneratingReadme] = useState(false);
  const [readmeError, setReadmeError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectData, reviewsData] = await Promise.all([
        apiClient<Project>(`/projects/${projectId}`),
        apiClient<Review[]>(`/projects/${projectId}/reviews`),
      ]);
      setProject(projectData);
      setReviews(reviewsData);

      if (projectData.files && projectData.files.length > 0 && !selectedFile) {
        handleSelectFile(projectData.files[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const handleSelectFile = async (file: ProjectFile) => {
    if (file.content !== undefined) {
      setSelectedFile(file);
      return;
    }

    try {
      const fullFile = await apiClient<ProjectFile>(`/files/${file.id}`);
      setSelectedFile(fullFile);
    } catch {
      setSelectedFile(file);
    }
  };

  const handleSelectReview = async (reviewId: string) => {
    setLoadingReviewDetail(true);
    try {
      const fullReview = await apiClient<Review>(`/reviews/${reviewId}`);
      setActiveReview(fullReview);
    } catch (err: any) {
      console.error('Failed to fetch review detail:', err);
    } finally {
      setLoadingReviewDetail(false);
    }
  };

  const handleReviewCreated = (newReview: Review) => {
    setReviews((prev) => [newReview, ...prev]);
    setActiveReview(newReview);
    setActiveTab('reviews');
  };

  const handleGenerateReadme = async () => {
    setIsReadmeModalOpen(true);
    setGeneratingReadme(true);
    setReadmeError(null);
    try {
      const res = await apiClient<{ readme: string }>(
        `/projects/${projectId}/generate-readme`,
        { method: 'POST' },
      );
      setReadmeContent(res.readme);
    } catch (err: any) {
      setReadmeError(err.message || 'Failed to generate README');
    } finally {
      setGeneratingReadme(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        <p className="text-sm">Loading project workspace...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 rounded-xl bg-surface border border-border text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white mb-1">Project Not Found</h2>
        <p className="text-sm text-gray-400 mb-6">{error || 'Could not load project.'}</p>
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
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/projects"
          className="inline-flex items-center space-x-1.5 text-xs text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleGenerateReadme}
            disabled={(project.files?.length ?? 0) === 0}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-surface hover:bg-surface-hover border border-border text-gray-200 hover:text-white text-xs font-semibold transition disabled:opacity-50"
            title="Generate a production-ready README for this project"
          >
            <FileText className="w-3.5 h-3.5 text-primary-400" />
            <span>Generate README</span>
          </button>

          <Link
            href={`/projects/${project.id}/chat`}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-surface hover:bg-surface-hover border border-border text-gray-200 hover:text-white text-xs font-semibold transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary-400" />
            <span>AI Codebase Chat</span>
          </Link>

          <button
            onClick={() => setIsReviewModalOpen(true)}
            disabled={(project.files?.length ?? 0) === 0}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white text-xs font-semibold transition shadow-lg shadow-primary-600/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>New AI Review</span>
          </button>
        </div>
      </div>

      {/* Project Header Banner */}
      <div className="bg-surface border border-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">{project.name}</h1>
            {project.language && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-background border border-border text-primary-400 uppercase">
                {project.language}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
            {project.description || 'No project description provided.'}
          </p>
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1.5 text-xs text-primary-400 hover:underline"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>{project.repoUrl}</span>
            </a>
          )}
        </div>

        <div className="flex items-center space-x-4 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 text-xs text-gray-400">
          <div>
            <div className="text-base font-bold text-white">{project.files?.length ?? 0}</div>
            <div className="text-[11px] text-gray-500">Source Files</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <div className="text-base font-bold text-white">{reviews.length}</div>
            <div className="text-[11px] text-gray-500">AI Reviews</div>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-border space-x-6">
        <button
          onClick={() => {
            setActiveTab('files');
            setActiveReview(null);
          }}
          className={`pb-3 text-xs font-semibold transition flex items-center space-x-2 border-b-2 uppercase tracking-wider ${
            activeTab === 'files'
              ? 'border-primary-500 text-white'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Code Explorer & Files ({project.files?.length ?? 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 text-xs font-semibold transition flex items-center space-x-2 border-b-2 uppercase tracking-wider ${
            activeTab === 'reviews'
              ? 'border-primary-500 text-white'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Review History ({reviews.length})</span>
        </button>
      </div>

      {/* Tab: Files Explorer */}
      {activeTab === 'files' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-2">
                <div className="flex items-center space-x-2">
                  <FolderGit2 className="w-4 h-4 text-primary-400" />
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">
                    Explorer
                  </span>
                </div>
                <span className="text-[11px] text-gray-400">
                  {project.files?.length ?? 0} files
                </span>
              </div>

              <FileTree
                files={project.files || []}
                selectedFileId={selectedFile?.id}
                onSelectFile={handleSelectFile}
              />
            </div>

            <FileUpload
              projectId={project.id}
              onUploadSuccess={loadData}
            />
          </div>

          <div className="lg:col-span-8 h-[650px]">
            <FilePreview file={selectedFile} projectId={projectId} />
          </div>
        </div>
      )}

      {/* Tab: Reviews */}
      {activeTab === 'reviews' && (
        <div>
          {loadingReviewDetail ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-2 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              <p className="text-xs">Loading review details...</p>
            </div>
          ) : activeReview ? (
            <ReviewDetail
              review={activeReview}
              onBack={() => setActiveReview(null)}
            />
          ) : (
            <ReviewHistory
              reviews={reviews}
              onSelectReview={handleSelectReview}
              onOpenNewReview={() => setIsReviewModalOpen(true)}
            />
          )}
        </div>
      )}

      {/* New Review Modal */}
      <ReviewForm
        projectId={project.id}
        files={project.files || []}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onReviewCreated={handleReviewCreated}
      />

      {/* Generated README Modal */}
      <ReadmeDialog
        isOpen={isReadmeModalOpen}
        onClose={() => setIsReadmeModalOpen(false)}
        readme={readmeContent}
        loading={generatingReadme}
        error={readmeError}
        projectName={project.name}
        onRegenerate={handleGenerateReadme}
      />
    </div>
  );
}

