import type { FC } from "react";
import type { AnalysisHighlight } from "../_types/analysis-highlight.types";
import { RiskIndicator } from "./risk-indicator";

interface HighlightedTextViewerProps {
  highlights: AnalysisHighlight[];
}

/**
 * Text viewer displaying highlighted sections, risk scores, and reasons.
 */
export const HighlightedTextViewer: FC<HighlightedTextViewerProps> = ({
  highlights,
}) => {
  if (highlights.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center text-xs text-primary/50">
        No specific AI risk passages flagged in this document.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-primary/60">
        Highlighted Content Passages
      </h3>
      <div className="space-y-3">
        {highlights.map((hl) => (
          <div
            key={hl.id}
            className="rounded-lg border border-border bg-card p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <RiskIndicator level={hl.riskLevel} />
              <span className="font-mono text-xs text-primary/60">
                Probability: {hl.probability}%
              </span>
            </div>
            <p className="font-mono text-xs rounded bg-primary/5 p-3 text-primary/80 border border-primary/10">
              "{hl.textSnippet}"
            </p>
            <p className="text-xs text-primary/60">
              <span className="font-medium text-primary">Diagnostic Reason:</span>{" "}
              {hl.reason}
            </p>
            {hl.severity && (
              <p className="text-xs text-primary/60">
                <span className="font-medium text-primary">Severity Level:</span>{" "}
                <span className="capitalize font-mono text-primary/80">{hl.severity}</span>
              </p>
            )}
            {hl.recommendation && (
              <div className="mt-2 rounded bg-amber-500/5 p-2.5 text-xs border border-amber-500/10 text-amber-700 dark:text-amber-400">
                <span className="font-semibold">Recommended Action:</span> {hl.recommendation}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
