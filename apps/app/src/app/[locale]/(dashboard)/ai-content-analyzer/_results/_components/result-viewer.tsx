"use client";

import { Button } from "@v1/ui/button";
import {
  Download,
  FileSearch,
  FileText,
  Loader2,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import type { FC } from "react";
import type { AnalysisJobItem } from "../../_jobs/analysis-job.types";
import { useAnalysisResult } from "../_hooks/use-analysis-result";
import { HighlightedTextViewer } from "./highlighted-text-viewer";
import { HumanizerResultCard } from "./humanizer-result-card";
import { MatchedSources } from "./matched-sources";
import { MetadataCard } from "./metadata-card";
import { PlagiarismResultCard } from "./plagiarism-result-card";
import { RecommendationsPanel } from "./recommendations-panel";
import { ResultSummaryCard } from "./result-summary-card";
import { RichAuditPanel } from "./rich-audit-panel";
import { StatisticsCard } from "./statistics-card";
import { WarningsPanel } from "./warnings-panel";

interface ResultViewerProps {
  jobId: string;
  documentName: string;
  textContent?: string;
  job?: AnalysisJobItem;
  onClose: () => void;
}

/**
 * Main report layout container displaying complete analysis findings.
 */
export const ResultViewer: FC<ResultViewerProps> = ({
  jobId,
  documentName,
  textContent,
  job,
  onClose,
}) => {
  const isHumanizerJob =
    job?.analysisType === "ai_humanizer" || job?.isHumanized;
  const isPlagiarismJob = job?.analysisType === "plagiarism";

  const { viewModel, isLoading, error } = useAnalysisResult(
    jobId,
    documentName,
    textContent,
  );

  if (isHumanizerJob && job) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="relative my-8 w-full max-w-4xl rounded-xl border border-border bg-card p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold text-primary">
                AI Content Humanizer Report
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
                aria-label="Close report"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <HumanizerResultCard job={job} />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-8 text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-primary">
            Constructing Result Engine Report...
          </p>
        </div>
      </div>
    );
  }

  if (error || !viewModel) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="max-w-md w-full rounded-lg border border-border bg-card p-6 space-y-4 text-center">
          <p className="text-sm text-red-500 font-medium">
            {error || "Unable to load analysis report."}
          </p>
          <Button onClick={onClose} variant="outline" size="sm">
            Close
          </Button>
        </div>
      </div>
    );
  }

  const { rawResult } = viewModel;

  // Plagiarism Search Dedicated View
  if (isPlagiarismJob) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="relative my-8 w-full max-w-4xl rounded-xl border border-border bg-card p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold text-primary">
                Plagiarism & Originality Report
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-1.5 h-3.5 w-3.5" /> Export PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
                aria-label="Close report"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Warnings Banner */}
          <WarningsPanel warnings={rawResult.warnings} />

          {/* Dedicated Plagiarism Card */}
          <PlagiarismResultCard rawResult={rawResult} job={job} />

          {/* Statistics & Metadata */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <StatisticsCard statistics={rawResult.statistics} />
            <MetadataCard metadata={rawResult.metadata} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative my-8 w-full max-w-4xl rounded-xl border border-border bg-card p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header Action Bar */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-primary">
              AI Forensic Detection Report
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              aria-label="Close report"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Warnings Banner */}
        <WarningsPanel warnings={rawResult.warnings} />

        {/* Summary Card & Scores */}
        <ResultSummaryCard viewModel={viewModel} />

        {/* Detailed Enterprise Audit Panels */}
        <RichAuditPanel rawResult={rawResult} />

        {/* Highlighted Passages */}
        <HighlightedTextViewer highlights={rawResult.highlights} />

        {/* Matched Sources */}
        <MatchedSources sources={rawResult.matchedSources} />

        {/* Recommendations Panel */}
        <RecommendationsPanel recommendations={rawResult.recommendations} />

        {/* Statistics & Metadata */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <StatisticsCard statistics={rawResult.statistics} />
          <MetadataCard metadata={rawResult.metadata} />
        </div>
      </div>
    </div>
  );
};
