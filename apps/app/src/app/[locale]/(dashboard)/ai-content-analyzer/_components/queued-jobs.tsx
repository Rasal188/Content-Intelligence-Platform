import { Button } from "@v1/ui/button";
import { Clock, StopCircle } from "lucide-react";
import type { FC } from "react";
import type { AnalysisJobItem } from "../_jobs/analysis-job.types";
import { JobStatusBadge } from "./job-status-badge";

interface QueuedJobsProps {
  jobs: AnalysisJobItem[];
  onCancel: (jobId: string) => void;
}

/**
 * Component listing pending queued jobs waiting to execute.
 */
export const QueuedJobs: FC<QueuedJobsProps> = ({ jobs, onCancel }) => {
  if (jobs.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-medium text-primary/60">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> Queued Execution Queue (
          {jobs.length})
        </span>
        <span>FIFO Queue</span>
      </div>

      <div className="divide-y divide-border/50 rounded-lg border border-border bg-card">
        {jobs.map((job, idx) => (
          <div
            key={job.id}
            className="flex items-center justify-between p-3 text-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-mono text-primary/40">#{idx + 1}</span>
              <div className="min-w-0">
                <p className="truncate font-medium text-primary">
                  {job.documentName}
                </p>
                <p className="text-[11px] text-primary/50">
                  ID: {job.id} • Mode: {job.analysisType}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <JobStatusBadge status={job.status} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onCancel(job.id)}
                className="h-7 px-2 text-xs text-red-500 hover:text-red-600"
              >
                <StopCircle className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
