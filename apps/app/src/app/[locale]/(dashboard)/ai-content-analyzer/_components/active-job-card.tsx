import { Button } from "@v1/ui/button";
import { Clock, Cpu, FileText, StopCircle } from "lucide-react";
import type { FC } from "react";
import type { AnalysisJobItem } from "../_jobs/analysis-job.types";
import { JobProgress } from "./job-progress";
import { JobStatusBadge } from "./job-status-badge";
import { JobTimeline } from "./job-timeline";

interface ActiveJobCardProps {
  job: AnalysisJobItem;
  onCancel: (jobId: string) => void;
}

/**
 * Card component displaying active running job details, progress, ETA, and timeline logs.
 */
export const ActiveJobCard: FC<ActiveJobCardProps> = ({ job, onCancel }) => {
  return (
    <div className="rounded-lg border border-primary/20 bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-medium text-primary">
                {job.documentName}
              </h3>
              <JobStatusBadge status={job.status} />
            </div>
            <p className="text-xs text-primary/50 flex items-center gap-3 mt-0.5">
              <span>Job ID: {job.id}</span>
              <span>Source: {job.inputSource}</span>
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onCancel(job.id)}
          className="text-red-500 hover:text-red-600 border-red-500/20"
        >
          <StopCircle className="mr-1.5 h-4 w-4" /> Cancel Job
        </Button>
      </div>

      <JobProgress progress={job.progress} stageName={job.currentStage} />

      <div className="grid grid-cols-2 gap-4 rounded-md bg-secondary/50 p-3 text-xs">
        <div className="flex items-center gap-2 text-primary/70">
          <Clock className="h-4 w-4 text-primary/40" />
          <span>Elapsed Time: {job.elapsedTime}s</span>
        </div>
        <div className="flex items-center gap-2 text-primary/70">
          <Cpu className="h-4 w-4 text-primary/40" />
          <span>Estimated ETA: ~{job.estimatedRemaining}s</span>
        </div>
      </div>

      <JobTimeline logs={job.logs} />
    </div>
  );
};
