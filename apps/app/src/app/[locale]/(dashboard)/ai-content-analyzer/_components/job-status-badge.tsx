import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";
import type { FC } from "react";
import type { JobState } from "../_jobs/analysis-job.types";

interface JobStatusBadgeProps {
  status: JobState;
  className?: string;
}

const STATUS_CONFIG: Record<
  JobState,
  { label: string; style: string; icon: React.ComponentType<{ className?: string }> }
> = {
  idle: { label: "Idle", style: "bg-secondary text-primary/60 ring-border", icon: Clock },
  queued: { label: "Queued", style: "bg-yellow-500/10 text-yellow-600 ring-yellow-600/20 dark:text-yellow-400", icon: Clock },
  preparing: { label: "Preparing", style: "bg-blue-500/10 text-blue-600 ring-blue-600/20 dark:text-blue-400", icon: Loader2 },
  running: { label: "Running", style: "bg-blue-500/10 text-blue-600 ring-blue-600/20 dark:text-blue-400", icon: Loader2 },
  generating_report: { label: "Reporting", style: "bg-purple-500/10 text-purple-600 ring-purple-600/20 dark:text-purple-400", icon: Loader2 },
  completed: { label: "Completed", style: "bg-green-500/10 text-green-600 ring-green-600/20 dark:text-green-400", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", style: "bg-gray-500/10 text-gray-600 ring-gray-600/20 dark:text-gray-400", icon: XCircle },
  failed: { label: "Failed", style: "bg-red-500/10 text-red-600 ring-red-600/20 dark:text-red-400", icon: AlertTriangle },
  retrying: { label: "Retrying", style: "bg-orange-500/10 text-orange-600 ring-orange-600/20 dark:text-orange-400", icon: Loader2 },
};

/**
 * Status badge pill component representing active job state.
 */
export const JobStatusBadge: FC<JobStatusBadgeProps> = ({ status, className = "" }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;
  const Icon = config.icon;
  const isAnimated = status === "preparing" || status === "running" || status === "generating_report" || status === "retrying";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${config.style} ${className}`}
    >
      <Icon className={`h-3.5 w-3.5 ${isAnimated ? "animate-spin" : ""}`} />
      <span>{config.label}</span>
    </span>
  );
};
