import type { HighlightRiskLevel } from "../_types/analysis-highlight.types";
import type { AnalysisResultDomain } from "../_types/analysis-result.types";

/**
 * UI Presentation ViewModel decoupling React UI components from internal domain models.
 */
export interface ResultViewModel {
  id: string;
  jobId: string;
  documentTitle: string;
  documentMetaText: string;
  riskBadgeLabel: string;
  riskBadgeColorStyle: string;
  originalityScoreText: string;
  aiScoreText: string;
  plagiarismScoreText: string;
  confidencePercentText: string;
  readingTimeText: string;
  isMockData: boolean;
  rawResult: AnalysisResultDomain;
}

/**
 * ViewModel mapper service transforming AnalysisResultDomain models into UI-optimized view models.
 */
export class ResultViewModelService {
  /**
   * Transforms an AnalysisResultDomain object into a ResultViewModel.
   * @param domain Domain model.
   * @returns Formatted ResultViewModel for UI binding.
   */
  public toViewModel(domain: AnalysisResultDomain): ResultViewModel {
    const riskMap: Record<
      HighlightRiskLevel,
      { label: string; style: string }
    > = {
      low: {
        label: "Low Risk",
        style:
          "bg-green-500/10 text-green-600 ring-green-600/20 dark:text-green-400",
      },
      medium: {
        label: "Moderate Risk",
        style:
          "bg-yellow-500/10 text-yellow-600 ring-yellow-600/20 dark:text-yellow-400",
      },
      high: {
        label: "High Risk",
        style:
          "bg-orange-500/10 text-orange-600 ring-orange-600/20 dark:text-orange-400",
      },
      critical: {
        label: "Critical AI Risk",
        style: "bg-red-500/10 text-red-600 ring-red-600/20 dark:text-red-400",
      },
    };

    const isEmpty = domain.document.wordCount === 0;
    const riskInfo = isEmpty
      ? {
          label: "Not Audited",
          style:
            "bg-secondary text-primary/40 ring-border dark:text-primary/50",
        }
      : riskMap[domain.overallRiskLevel] || riskMap.low;

    const formatScore = (val: number) => (val < 0 ? "--" : `${val}%`);
    const formatConfidence = (val: number) => (val < 0 ? "--" : `${val}%`);

    return {
      id: domain.id,
      jobId: domain.jobId,
      documentTitle: domain.document.name,
      documentMetaText: `${domain.document.type} • ${domain.statistics.words} words • ${domain.statistics.characters} chars`,
      riskBadgeLabel: riskInfo.label,
      riskBadgeColorStyle: riskInfo.style,
      originalityScoreText: formatScore(domain.scores.overallOriginality.value),
      aiScoreText: formatScore(domain.scores.aiProbability.value),
      plagiarismScoreText: formatScore(
        domain.scores.plagiarismSimilarity.value,
      ),
      confidencePercentText: formatConfidence(
        domain.scores.aiProbability.confidence,
      ),
      readingTimeText: isEmpty
        ? "0 min read"
        : `~${domain.statistics.estimatedReadingTimeMinutes} min read`,
      isMockData: domain.metadata.isMockData,
      rawResult: domain,
    };
  }
}

const viewModelServiceInstance = new ResultViewModelService();

/**
 * Factory function acquiring ResultViewModelService.
 * @returns ResultViewModelService instance.
 */
export function getResultViewModelService(): ResultViewModelService {
  return viewModelServiceInstance;
}
