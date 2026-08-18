import { AlertTriangle, Info, XCircle } from "lucide-react";
import type { FC } from "react";
import type { AnalysisWarning } from "../_types/analysis-warning.types";

interface WarningsPanelProps {
  warnings: AnalysisWarning[];
}

const SEVERITY_CONFIG: Record<
  AnalysisWarning["severity"],
  {
    style: string;
    badgeStyle: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  info: {
    style: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
    badgeStyle:
      "bg-blue-500/20 text-blue-700 ring-blue-500/30 dark:text-blue-300",
    icon: Info,
  },
  warning: {
    style:
      "border-yellow-500/20 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    badgeStyle:
      "bg-yellow-500/20 text-yellow-700 ring-yellow-500/30 dark:text-yellow-300",
    icon: AlertTriangle,
  },
  error: {
    style: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
    badgeStyle: "bg-red-500/20 text-red-700 ring-red-500/30 dark:text-red-300",
    icon: XCircle,
  },
};

/**
 * Diagnostic warnings panel component.
 */
export const WarningsPanel: FC<WarningsPanelProps> = ({ warnings }) => {
  if (warnings.length === 0) return null;

  return (
    <div className="space-y-2">
      {warnings.map((warn) => {
        const config = SEVERITY_CONFIG[warn.severity] || SEVERITY_CONFIG.info;
        const Icon = config.icon;
        return (
          <div
            key={warn.id}
            className={`flex items-start gap-2.5 rounded-lg border p-3 text-xs ${config.style}`}
          >
            <Icon className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase ring-1 ring-inset ${config.badgeStyle}`}
              >
                {warn.severity}
              </span>
              <span className="font-mono font-semibold">[{warn.code}]</span>{" "}
              <span>{warn.message}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
