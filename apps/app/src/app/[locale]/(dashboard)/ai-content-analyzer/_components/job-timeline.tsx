import { CheckCircle2, Clock, Info, XCircle } from "lucide-react";
import type { FC } from "react";
import type { JobLogItem, LogLevel } from "../_jobs/analysis-job.types";

interface JobTimelineProps {
  logs: JobLogItem[];
}

const LEVEL_ICON_MAP: Record<
  LogLevel,
  React.ComponentType<{ className?: string }>
> = {
  info: Info,
  success: CheckCircle2,
  warning: Clock,
  error: XCircle,
};

const LEVEL_STYLE_MAP: Record<LogLevel, string> = {
  info: "text-blue-500",
  success: "text-green-500",
  warning: "text-yellow-500",
  error: "text-red-500",
};

/**
 * Event log timeline displaying execution events for an Analysis Job.
 */
export const JobTimeline: FC<JobTimelineProps> = ({ logs }) => {
  if (logs.length === 0) return null;

  return (
    <div className="space-y-2 border-t border-border/50 pt-3">
      <h4 className="text-xs font-medium uppercase tracking-wide text-primary/40">
        Job Execution Timeline
      </h4>
      <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
        {logs.map((log) => {
          const Icon = LEVEL_ICON_MAP[log.level] || Info;
          const style = LEVEL_STYLE_MAP[log.level] || "text-primary/50";
          return (
            <div
              key={log.id}
              className="flex items-start justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon className={`h-3.5 w-3.5 shrink-0 ${style}`} />
                <span className="font-medium text-primary/80 truncate">
                  [{log.stage}] {log.message}
                </span>
              </div>
              <span className="shrink-0 font-mono text-[10px] text-primary/40">
                {new Date(log.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
