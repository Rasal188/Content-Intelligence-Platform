import { Button } from "@v1/ui/button";
import { History, Trash2 } from "lucide-react";
import type { FC } from "react";
import type { AnalysisJobItem } from "../_jobs/analysis-job.types";
import { CompletedJobCard } from "./completed-job-card";
import { EmptyState } from "./empty-state";

interface JobHistoryProps {
  jobs: AnalysisJobItem[];
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onClearHistory: () => void;
  onViewReport?: (job: AnalysisJobItem) => void;
}

/**
 * Job history section component listing finished analysis jobs.
 */
export const JobHistory: FC<JobHistoryProps> = ({
  jobs,
  onDuplicate,
  onDelete,
  onClearHistory,
  onViewReport,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-medium text-primary">Job History</h2>
          <p className="text-xs text-primary/50">
            Past completed and processing job records
          </p>
        </div>

        {jobs.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClearHistory}
            className="text-xs text-red-500 hover:text-red-600"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear History
          </Button>
        )}
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          title="No job history"
          description="Completed analysis jobs will be logged in history."
          icon={<History className="h-6 w-6" />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <CompletedJobCard
              key={job.id}
              job={job}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onViewReport={onViewReport}
            />
          ))}
        </div>
      )}
    </div>
  );
};
