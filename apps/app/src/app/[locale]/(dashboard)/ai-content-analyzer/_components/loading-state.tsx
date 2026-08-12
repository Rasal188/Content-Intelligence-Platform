import { Loader2 } from "lucide-react";
import type { FC } from "react";
import type { LoadingStage } from "../_types/analysis";

interface LoadingStateProps {
  stage: LoadingStage;
  progressPercent: number;
}

const STAGE_LABEL_MAP: Record<LoadingStage, string> = {
  idle: "Initializing...",
  uploading: "Uploading document...",
  extracting_text: "Extracting text content...",
  preparing_analysis: "Preparing neural models...",
  running_detection: "Running AI pattern detection & plagiarism search...",
  generating_report: "Generating verification report...",
  completed: "Analysis complete!",
};

/**
 * Animated progressive loading indicator component.
 */
export const LoadingState: FC<LoadingStateProps> = ({
  stage,
  progressPercent,
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-8 text-center space-y-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-medium text-primary">
          {STAGE_LABEL_MAP[stage] || "Processing..."}
        </h3>
        <p className="text-xs text-primary/50">
          Please wait while your content is analyzed.
        </p>
      </div>

      <div className="w-full max-w-xs space-y-1.5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-primary/10">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
          />
        </div>
        <p className="text-right text-[11px] font-mono text-primary/60">
          {progressPercent}%
        </p>
      </div>
    </div>
  );
};
