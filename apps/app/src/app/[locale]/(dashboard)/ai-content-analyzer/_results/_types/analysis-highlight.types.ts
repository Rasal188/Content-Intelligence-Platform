/**
 * Risk level classification for highlighted content segments.
 */
export type HighlightRiskLevel = "low" | "medium" | "high" | "critical";

/**
 * Highlighted text segment with risk score and diagnostic reasoning.
 */
export interface AnalysisHighlight {
  id: string;
  startIndex: number;
  endIndex: number;
  textSnippet: string;
  probability: number; // 0 - 100
  riskLevel: HighlightRiskLevel;
  reason: string;
  severity?: string;
  recommendation?: string;
}
