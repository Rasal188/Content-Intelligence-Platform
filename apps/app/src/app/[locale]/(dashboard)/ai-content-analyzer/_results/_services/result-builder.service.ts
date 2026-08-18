import type { AnalysisResultDomain } from "../_types/analysis-result.types";
import { MockResultProvider } from "./providers/mock-result.provider";
import { OllimaResultProvider } from "./providers/ollima-result.provider";
import type { IAnalysisProvider } from "./providers/interfaces/IAnalysisProvider";

/**
 * Service builder normalizing, validating, and constructing immutable AnalysisResultDomain entities.
 */
export class ResultBuilderService {
  private mockProvider = new MockResultProvider();
  private resultCache = new Map<string, AnalysisResultDomain>();

  constructor(private provider: IAnalysisProvider) {}

  /**
   * Constructs an AnalysisResultDomain model from job parameters.
   * Tries Ollima gateway provider first, and automatically falls back to Mock Provider on failure only in development mode.
   * @param jobId Parent Job ID.
   * @param documentName Name of analyzed document.
   * @param textContent Raw text content.
   * @returns Promise resolving to AnalysisResultDomain.
   */
  async buildResult(
    jobId: string,
    documentName: string,
    textContent?: string,
    analysisType?: string
  ): Promise<AnalysisResultDomain> {
    const cached = this.resultCache.get(jobId);
    if (cached) {
      return cached;
    }

    // Generate a unique Request ID for this content analysis execution
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    try {
      const domainResult = await this.provider.analyze(
        jobId,
        documentName,
        textContent || "",
        requestId,
        analysisType
      );
      
      const normalizedResult = this.validateAndNormalize(domainResult);
      this.resultCache.set(jobId, normalizedResult);
      return normalizedResult;
    } catch (err) {
      const isDevMock = process.env.NODE_ENV === "development" && process.env.MOCK_ANALYSIS === "true";
      if (isDevMock) {
        console.warn("Ollima Provider execution failed. Falling back to MockProvider:", err);
        const mockResult = await this.mockProvider.generateResult(
          jobId,
          documentName,
          textContent || "",
          requestId
        );
        
        // Inject fallback failure metadata
        mockResult.metadata.providerName = "Development Fallback (Mock Provider)";
        mockResult.metadata.failureReason = typeof err === "object" && err && "message" in err ? String((err as any).message) : "Automatic fallback";

        const normalizedResult = this.validateAndNormalize(mockResult);
        this.resultCache.set(jobId, normalizedResult);
        return normalizedResult;
      }

      // Production Mode: propagate the real network/auth exception up to fail the job cleanly
      throw err;
    }
  }

  /**
   * Validates and normalizes domain models ensuring immutable constraints.
   * @param result Raw domain result payload.
   * @returns Validated AnalysisResultDomain entity.
   */
  private validateAndNormalize(result: AnalysisResultDomain): AnalysisResultDomain {
    // Ensure numbers are bounded between 0 and 100, while preserving negative sentinels (e.g. -1)
    const clamp = (n: number) => n < 0 ? n : Math.min(100, Math.max(0, n));

    return Object.freeze({
      ...result,
      scores: {
        ...result.scores,
        overallOriginality: {
          ...result.scores.overallOriginality,
          value: clamp(result.scores.overallOriginality.value),
        },
        aiProbability: {
          ...result.scores.aiProbability,
          value: clamp(result.scores.aiProbability.value),
        },
        plagiarismSimilarity: {
          ...result.scores.plagiarismSimilarity,
          value: clamp(result.scores.plagiarismSimilarity.value),
        },
        readabilityQuality: {
          ...result.scores.readabilityQuality,
          value: clamp(result.scores.readabilityQuality.value),
        },
      },
    });
  }
}

// Singleton instances resolving to Ollima provider for V2
const defaultResultProvider = new OllimaResultProvider();
const resultBuilderInstance = new ResultBuilderService(defaultResultProvider);

/**
 * Factory function for acquiring ResultBuilderService instance.
 * @returns Configured ResultBuilderService.
 */
export function getResultBuilderService(): ResultBuilderService {
  return resultBuilderInstance;
}
