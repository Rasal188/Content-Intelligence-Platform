import type {
  AnalysisJob,
  AnalysisRequest,
  DocumentItem,
  LoadingStage,
} from "../_types/analysis";
import {
  type IAnalysisProvider,
  MockAnalysisProvider,
} from "./providers/mock.provider";

/**
 * Service orchestrator wrapping active provider (Dependency Injection pattern).
 */
export class AnalysisService {
  constructor(private provider: IAnalysisProvider) {}

  /**
   * Submits an analysis request to the active provider.
   * @param request AnalysisRequest payload.
   * @param onProgress Progress update callback.
   */
  async submitAnalysis(
    request: AnalysisRequest,
    onProgress?: (stage: LoadingStage, percent: number) => void,
  ): Promise<AnalysisJob> {
    return this.provider.submitAnalysis(request, onProgress);
  }

  /**
   * Fetches recent analysis jobs.
   */
  async getRecentAnalyses(): Promise<AnalysisJob[]> {
    return this.provider.getRecentAnalyses();
  }

  /**
   * Fetches recent documents.
   */
  async getRecentDocuments(): Promise<DocumentItem[]> {
    return this.provider.getRecentDocuments();
  }
}

// Singleton provider instance (Switchable to Convex Provider in future sprints)
const defaultProvider: IAnalysisProvider = new MockAnalysisProvider();

// Singleton service instance
const analysisServiceInstance = new AnalysisService(defaultProvider);

/**
 * Dependency Injection factory function returning current AnalysisService instance.
 * Decouples React UI components from provider selection.
 * @returns Configured AnalysisService instance.
 */
export function getAnalysisService(): AnalysisService {
  return analysisServiceInstance;
}
