import type { HighlightRiskLevel } from "../../_types/analysis-highlight.types";

/**
 * Utility mapping numeric scores to qualitative risk levels.
 */
export class RiskLevelCalculator {
  /**
   * Maps a score to a standard HighlightRiskLevel.
   * @param aiScore Calculated AI probability score (0 to 100).
   * @returns "low" | "medium" | "high" | "critical"
   */
  public static calculate(aiScore: number): HighlightRiskLevel {
    if (aiScore < 20) {
      return "low"; // Very Low
    }
    if (aiScore < 45) {
      return "low"; // Low
    }
    if (aiScore < 70) {
      return "medium"; // Moderate
    }
    if (aiScore < 85) {
      return "high"; // High
    }
    return "critical"; // Very High / Critical
  }

  /**
   * Maps score to text-friendly descriptions (e.g. for summaries).
   * @param score Calculated score (0 to 100).
   * @returns Risk category string.
   */
  public static getLabel(score: number): "Very Low" | "Low" | "Moderate" | "High" | "Very High" {
    if (score <= 20) return "Very Low";
    if (score <= 40) return "Low";
    if (score <= 60) return "Moderate";
    if (score <= 80) return "High";
    return "Very High";
  }
}
