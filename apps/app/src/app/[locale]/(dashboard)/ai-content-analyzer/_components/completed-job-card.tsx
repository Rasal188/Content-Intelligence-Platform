import { Button } from "@v1/ui/button";
import { Copy, Eye, FileText, Trash2 } from "lucide-react";
import type { FC } from "react";
import type { AnalysisJobItem } from "../_jobs/analysis-job.types";
import { JobStatusBadge } from "./job-status-badge";

interface CompletedJobCardProps {
  job: AnalysisJobItem;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onViewReport?: (job: AnalysisJobItem) => void;
}

const TYPE_LABEL_MAP: Record<string, string> = {
  ai_detection: "AI Detection",
  plagiarism: "Plagiarism Search",
  ai_humanizer: "AI Humanizer",
  full_audit: "AI Humanizer",
};

/**
 * Card component for displaying finished, cancelled, or failed jobs.
 */
export const CompletedJobCard: FC<CompletedJobCardProps> = ({
  job,
  onDuplicate,
  onDelete,
  onViewReport,
}) => {
  return (
    <div className="flex flex-col justify-between rounded-lg border border-border bg-card p-4 space-y-3 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h4 className="truncate text-sm font-medium text-primary">
              {job.documentName}
            </h4>
            <p className="text-xs text-primary/50">
              {TYPE_LABEL_MAP[job.analysisType] || job.analysisType} •{" "}
              {job.elapsedTime}s duration
            </p>
          </div>
        </div>
        <JobStatusBadge status={job.status} />
      </div>

      {job.result && (
        <div className="grid grid-cols-2 gap-2 rounded-md bg-secondary/50 p-2 text-center text-xs">
          {job.analysisType === "plagiarism" ? (
            <>
              <div>
                <span className="text-[10px] text-primary/40 uppercase block">
                  Originality
                </span>
                <span className="font-mono text-sm font-bold text-green-600 dark:text-green-400">
                  {job.result.overallScore}%
                </span>
              </div>
              <div>
                <span className="text-[10px] text-primary/40 uppercase block">
                  Plagiarism
                </span>
                <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">
                  {job.result.plagiarismScore ?? Math.max(0, 100 - job.result.overallScore)}%
                </span>
              </div>
            </>
          ) : job.analysisType === "ai_humanizer" || job.isHumanized ? (
            <>
              <div>
                <span className="text-[10px] text-primary/40 uppercase block">
                  AI Likelihood
                </span>
                <span className="font-mono text-sm font-bold text-green-600 dark:text-green-400">
                  {job.result.humanizedAiScore ?? job.result.aiScore}%
                </span>
              </div>
              <div>
                <span className="text-[10px] text-primary/40 uppercase block">
                  Readability
                </span>
                <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                  {job.result.readabilityScore ?? 90}%
                </span>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="text-[10px] text-primary/40 uppercase block">
                  AI Likelihood
                </span>
                <span className="font-mono text-sm font-bold text-primary/80">
                  {job.result.aiScore}%
                </span>
              </div>
              <div>
                <span className="text-[10px] text-primary/40 uppercase block">
                  Human Likelihood
                </span>
                <span className="font-mono text-sm font-bold text-green-600 dark:text-green-400">
                  {Math.max(0, 100 - job.result.aiScore)}%
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {job.error && (
        <p className="text-xs text-red-500 bg-red-500/10 p-2 rounded border border-red-500/20">
          {job.error}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-border/50 pt-3">
        <span className="text-[11px] text-primary/40 font-mono">
          {new Date(job.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onViewReport?.(job)}
            className="h-7 px-2 text-xs"
            title="View Report"
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> Report
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onDuplicate(job.id)}
            className="h-7 px-2 text-xs"
            title="Re-run / Duplicate Job"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onDelete(job.id)}
            className="h-7 px-2 text-xs text-red-500 hover:text-red-600"
            title="Delete Job Entry"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
