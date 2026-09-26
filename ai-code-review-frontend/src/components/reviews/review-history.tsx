// src/components/reviews/review-history.tsx
'use client';

import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Clock,
  FileCode,
  Plus,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Review } from '@/lib/types';

interface ReviewHistoryProps {
  reviews: Review[];
  onSelectReview: (reviewId: string) => void;
  onOpenNewReview: () => void;
}

export function ReviewHistory({
  reviews,
  onSelectReview,
  onOpenNewReview,
}: ReviewHistoryProps) {
  const [filterMode, setFilterMode] = useState<string>('all');

  const filteredReviews = reviews.filter((r) => {
    if (filterMode === 'all') return true;
    return r.mode?.toLowerCase() === filterMode.toLowerCase();
  });

  if (reviews.length === 0) {
    return (
      <div className="py-20 text-center border border-dashed border-border rounded-xl bg-surface/30">
        <Sparkles className="w-12 h-12 text-gray-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white mb-1">No reviews yet</h3>
        <p className="text-xs text-gray-400 max-w-sm mx-auto mb-6">
          Initiate an automated code review to check for security vulnerabilities, quality issues, or performance bottlenecks.
        </p>
        <button
          onClick={onOpenNewReview}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold transition shadow-lg shadow-primary-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Start First Review</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header filter & new review action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">Filter mode:</span>
          <div className="flex items-center space-x-1 bg-surface p-1 rounded-lg border border-border text-xs">
            {['all', 'quality', 'security', 'performance'].map((m) => (
              <button
                key={m}
                onClick={() => setFilterMode(m)}
                className={`px-3 py-1 rounded capitalize transition ${
                  filterMode === m
                    ? 'bg-surface-hover text-white font-medium shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onOpenNewReview}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold transition shadow-md shadow-primary-600/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Review</span>
        </button>
      </div>

      {/* Reviews Cards List */}
      <div className="space-y-3">
        {filteredReviews.map((rev) => (
          <div
            key={rev.id}
            onClick={() => onSelectReview(rev.id)}
            className="group bg-surface hover:bg-surface-hover border border-border hover:border-primary-500/40 rounded-xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 shadow-sm hover:shadow-lg hover:shadow-primary-600/5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center space-x-3">
                <span
                  className={`text-xs font-mono uppercase px-2.5 py-1 rounded font-bold ${
                    rev.mode === 'security'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : rev.mode === 'performance'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-primary-600/10 text-primary-400 border border-primary-500/20'
                  }`}
                >
                  {rev.mode}
                </span>

                <span
                  className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                    rev.status === 'COMPLETED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : rev.status === 'FAILED'
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}
                >
                  {rev.status}
                </span>

                <span className="text-xs text-gray-500">
                  Scope: <span className="uppercase text-gray-300 font-medium">{rev.scope}</span>
                </span>
              </div>

              {rev.score !== null && rev.score !== undefined && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">Health Score:</span>
                  <span
                    className={`text-sm font-bold ${
                      rev.score >= 80
                        ? 'text-emerald-400'
                        : rev.score >= 50
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    {rev.score}/100
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
              {rev.summary || rev.summaryPreview || 'No summary available.'}
            </p>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  <span>{new Date(rev.createdAt).toLocaleString()}</span>
                </span>

                {rev.file?.path && (
                  <span className="flex items-center space-x-1 font-mono text-gray-400 truncate max-w-xs">
                    <FileCode className="w-3.5 h-3.5 text-primary-400" />
                    <span className="truncate">{rev.file.path}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-1 text-primary-400 group-hover:text-primary-300 font-medium text-xs">
                <span>View Analysis</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
