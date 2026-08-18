import type { FC } from "react";
import type { AnalysisScore } from "../_types/analysis-score.types";

interface ScoreCardProps {
  score: AnalysisScore;
}

/**
 * Score card component for rendering evaluated metric values and confidence.
 */
export const ScoreCard: FC<ScoreCardProps> = ({ score }) => {
  const isValEmpty = score.value === -1 || score.confidence === -1;

  // Determine dynamic typography color based on score type and threshold values
  let scoreColorStyle = "text-primary";
  if (!isValEmpty) {
    if (score.id === "score-orig") {
      scoreColorStyle = "text-green-600 dark:text-green-400";
    } else if (score.id === "score-ai") {
      scoreColorStyle = score.value > 50 
        ? "text-red-600 dark:text-red-400" 
        : score.value > 20 
          ? "text-orange-500 dark:text-orange-400" 
          : "text-green-600 dark:text-green-400";
    } else if (score.id === "score-plag") {
      scoreColorStyle = score.value > 20 
        ? "text-red-600 dark:text-red-400" 
        : score.value > 5 
          ? "text-yellow-600 dark:text-yellow-500" 
          : "text-green-600 dark:text-green-400";
    } else if (score.id === "score-read") {
      scoreColorStyle = "text-blue-600 dark:text-blue-400";
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2 flex flex-col justify-between">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-primary/60">{score.name}</span>
          <span className="text-[10px] font-mono text-primary/40">
            Confidence: {isValEmpty ? "--" : `${score.confidence}%`}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold font-mono ${scoreColorStyle}`}>
            {isValEmpty ? "--" : `${score.value}%`}
          </span>
        </div>
        <p className="text-xs text-primary/50">{score.description}</p>
      </div>
      {score.id === "score-plag" && (
        <p className="text-[10px] leading-snug text-primary/40 border-t border-border/40 pt-2 mt-1 italic">
          This assessment is generated from forensic linguistic and structural analysis of the submitted document. External source verification and web-scale plagiarism detection are not currently enabled.
        </p>
      )}
    </div>
  );
};
