/**
 * Reusable analysis score model representing a metric evaluated during processing.
 */
export interface AnalysisScore {
  id: string;
  name: string;
  value: number; // Percentage 0 - 100
  confidence: number; // Percentage 0 - 100
  weight: number; // Weight multiplier
  description: string;
}

/**
 * Collection of evaluated scores for a result payload.
 */
export interface AnalysisScores {
  humanProbability?: AnalysisScore;
  overallOriginality: AnalysisScore;
  aiProbability: AnalysisScore;
  mixedProbability?: AnalysisScore;
  plagiarismSimilarity: AnalysisScore;
  readabilityQuality: AnalysisScore;
}

