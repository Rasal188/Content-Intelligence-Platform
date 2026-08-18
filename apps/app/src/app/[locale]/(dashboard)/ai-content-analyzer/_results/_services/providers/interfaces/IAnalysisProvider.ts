import type { AnalysisResultDomain } from "../../../_types/analysis-result.types";

/**
 * Interface contract for AI Content Analyzer V2 Forensic Analysis Providers.
 */
export interface IAnalysisProvider {
  analyze(
    jobId: string,
    documentName: string,
    textContent: string,
    requestId?: string,
    analysisType?: string
  ): Promise<AnalysisResultDomain>;
}
