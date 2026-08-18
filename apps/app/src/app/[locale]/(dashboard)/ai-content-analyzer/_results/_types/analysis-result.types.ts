import type { AnalysisExtensions } from "./analysis-extension.types";
import type { AnalysisHighlight, HighlightRiskLevel } from "./analysis-highlight.types";
import type { AnalysisMetadata } from "./analysis-metadata.types";
import type { AnalysisRecommendation } from "./analysis-recommendation.types";
import type { AnalysisScores } from "./analysis-score.types";
import type { MatchedSource } from "./analysis-source.types";
import type { AnalysisStatistics } from "./analysis-statistics.types";
import type { AnalysisWarning } from "./analysis-warning.types";
import type { DocumentSnapshot } from "./document-snapshot.types";

/**
 * Composite domain model representing the complete immutable Analysis Result payload.
 */
export interface AnalysisResultDomain {
  id: string;
  jobId: string;
  overallRiskLevel: HighlightRiskLevel;
  document: DocumentSnapshot;
  scores: AnalysisScores;
  statistics: AnalysisStatistics;
  metadata: AnalysisMetadata;
  highlights: AnalysisHighlight[];
  matchedSources: MatchedSource[];
  recommendations: AnalysisRecommendation[];
  warnings: AnalysisWarning[];
  extensions: AnalysisExtensions;
}
