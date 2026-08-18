import { ShieldCheck } from "lucide-react";
import type { FC } from "react";

interface ConfidenceCardProps {
  confidencePercent: number;
}

/**
 * Card displaying overall model confidence index.
 */
export const ConfidenceCard: FC<ConfidenceCardProps> = ({
  confidencePercent,
}) => {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-primary">
            Analysis Confidence
          </h4>
          <span className="font-mono text-xs font-semibold text-primary/80">
            {confidencePercent}%
          </span>
        </div>
        <p className="text-xs text-primary/50">
          Evaluated against forensic linguistic patterns, syntax burstiness, and structural consistency.
        </p>
      </div>
    </div>
  );
};
