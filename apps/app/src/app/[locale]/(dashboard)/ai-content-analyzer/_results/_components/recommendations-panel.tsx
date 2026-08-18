import { CheckCircle2, Lightbulb } from "lucide-react";
import type { FC } from "react";
import type { AnalysisRecommendation } from "../_types/analysis-recommendation.types";

interface RecommendationsPanelProps {
  recommendations: AnalysisRecommendation[];
}

/**
 * Recommendations list panel component.
 */
export const RecommendationsPanel: FC<RecommendationsPanelProps> = ({
  recommendations,
}) => {
  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-primary/60">
        Actionable Recommendations
      </h3>
      <div className="space-y-2">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="text-sm font-medium text-primary">
                  {rec.title}
                </h4>
                <div className="flex flex-wrap items-center gap-1.5 shrink-0 mt-1 sm:mt-0">
                  <span className={`rounded px-2 py-0.5 font-mono text-[9px] uppercase font-medium ring-1 ring-inset ${
                    rec.priority === "high"
                      ? "bg-red-500/10 text-red-600 ring-red-500/20 dark:text-red-400"
                      : rec.priority === "medium"
                        ? "bg-yellow-500/10 text-yellow-600 ring-yellow-500/20 dark:text-yellow-400"
                        : "bg-green-500/10 text-green-600 ring-green-500/20 dark:text-green-400"
                  }`}>
                    {rec.priority} Priority
                  </span>
                  <span className="rounded bg-blue-500/10 ring-1 ring-inset ring-blue-500/20 px-2 py-0.5 font-mono text-[9px] uppercase font-medium text-blue-600 dark:text-blue-400">
                    {rec.category}
                  </span>
                  <span className={`rounded px-2 py-0.5 font-mono text-[9px] uppercase font-medium ring-1 ring-inset ${
                    rec.status === "applied"
                      ? "bg-green-500/10 text-green-600 ring-green-500/20 dark:text-green-400"
                      : rec.status === "dismissed"
                        ? "bg-primary/10 text-primary/50 ring-primary/20"
                        : "bg-secondary text-primary/60 ring-border"
                  }`}>
                    {rec.status}
                  </span>
                </div>
              </div>
              <p className="text-xs text-primary/60">{rec.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
