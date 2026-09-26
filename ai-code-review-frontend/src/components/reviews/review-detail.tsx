// src/components/reviews/review-detail.tsx
'use client';

import { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileCode,
  Info,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Review, ReviewIssue } from '@/lib/types';

interface ReviewDetailProps {
  review: Review;
  onBack?: () => void;
}

export function ReviewDetail({ review, onBack }: ReviewDetailProps) {
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const issues = review.issues || [];

  const counts = {
    critical: issues.filter((i) => i.severity?.toLowerCase() === 'critical').length,
    high: issues.filter((i) => i.severity?.toLowerCase() === 'high').length,
    medium: issues.filter((i) => i.severity?.toLowerCase() === 'medium').length,
    low: issues.filter((i) => i.severity?.toLowerCase() === 'low').length,
  };

  const filteredIssues = issues.filter((issue) => {
    if (severityFilter === 'all') return true;
    return issue.severity?.toLowerCase() === severityFilter.toLowerCase();
  });

  const getSeverityBadge = (severity: string) => {
    const s = severity?.toLowerCase();
    switch (s) {
      case 'critical':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
            <AlertCircle className="w-3 h-3" />
            <span>Critical</span>
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
            <AlertTriangle className="w-3 h-3" />
            <span>High</span>
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" />
            <span>Medium</span>
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Info className="w-3 h-3" />
            <span>Low</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Reviews</span>
        </button>
      )}

      {/* Header Metric Card */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono uppercase px-2.5 py-1 rounded bg-primary-600/15 border border-primary-500/25 text-primary-400 font-bold">
                {review.mode} Audit
              </span>
              <span className="text-xs px-2.5 py-1 rounded bg-surface border border-border text-gray-300">
                Scope: <span className="font-semibold uppercase text-white">{review.scope}</span>
              </span>
              <span className="text-xs text-gray-500">
                {new Date(review.createdAt).toLocaleString()}
              </span>
            </div>

            <h2 className="text-xl font-bold text-white tracking-tight">Code Review Analysis</h2>
          </div>

          {/* Score Badge & Severity Counter */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-xs">
              <div className="text-center px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="font-bold text-red-400 text-sm">{counts.critical}</div>
                <div className="text-[10px] text-gray-400">Critical</div>
              </div>
              <div className="text-center px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="font-bold text-orange-400 text-sm">{counts.high}</div>
                <div className="text-[10px] text-gray-400">High</div>
              </div>
              <div className="text-center px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="font-bold text-amber-400 text-sm">{counts.medium}</div>
                <div className="text-[10px] text-gray-400">Medium</div>
              </div>
              <div className="text-center px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="font-bold text-blue-400 text-sm">{counts.low}</div>
                <div className="text-[10px] text-gray-400">Low</div>
              </div>
            </div>

            {review.score !== null && review.score !== undefined && (
              <div className="text-center pl-4 border-l border-border">
                <div
                  className={`text-3xl font-black ${
                    review.score >= 80
                      ? 'text-emerald-400'
                      : review.score >= 50
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}
                >
                  {review.score}
                  <span className="text-xs text-gray-500 font-normal">/100</span>
                </div>
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Health Score
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Box */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-3">
        <div className="flex items-center space-x-2 text-primary-400">
          <Sparkles className="w-5 h-5" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Executive Summary
          </h3>
        </div>
        <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
          {review.summary || 'No summary provided.'}
        </p>
      </div>

      {/* Issues Table / Cards */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Detected Issues ({issues.length})
            </h3>
          </div>

          {/* Severity Filter Tabs */}
          <div className="flex items-center space-x-1.5 bg-background p-1 rounded-lg border border-border text-xs">
            {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded capitalize transition ${
                  severityFilter === sev
                    ? 'bg-surface-hover text-white font-semibold shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {filteredIssues.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500 flex flex-col items-center justify-center space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-1" />
            <p className="font-medium text-gray-300">No issues found matching filter.</p>
            <p className="text-gray-500">Your code passed all criteria for this tier.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIssues.map((issue: ReviewIssue, idx: number) => (
              <div
                key={idx}
                className="bg-background/80 border border-border/80 rounded-xl p-4 space-y-2.5 transition hover:border-gray-700"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    {getSeverityBadge(issue.severity)}
                    <span className="text-sm font-bold text-white tracking-tight">
                      {issue.title}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs font-mono text-gray-400 bg-surface px-2.5 py-1 rounded border border-border">
                    <FileCode className="w-3.5 h-3.5 text-primary-400" />
                    <span className="truncate max-w-xs">{issue.file}</span>
                    {issue.line !== null && issue.line !== undefined && (
                      <span className="text-primary-400 font-semibold">:L{issue.line}</span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed pl-1 whitespace-pre-wrap">
                  {issue.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations Box */}
      {review.recommendations && (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-3">
          <div className="flex items-center space-x-2 text-emerald-400">
            <Lightbulb className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Recommendations & Next Steps
            </h3>
          </div>
          <div className="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap pl-1 font-sans">
            {review.recommendations}
          </div>
        </div>
      )}
    </div>
  );
}
