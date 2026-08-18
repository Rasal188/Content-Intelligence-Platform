import { ProviderConfigurationError } from "./interfaces/ProviderConfigurationError";
import type { IAnalysisProvider } from "./interfaces/IAnalysisProvider";
import type { AnalysisResultDomain } from "../../_types/analysis-result.types";

/**
 * Placeholder for future OllaGraph Provider integration.
 * Preserves decopled architecture interface mapping.
 */
export class OllaGraphProvider implements IAnalysisProvider {
  /**
   * Triggers analysis call placeholder.
   * @param jobId Analysis Job ID.
   * @param documentName Document Name.
   * @param textContent Extracted content text.
   * @param requestId Generated request ID.
   * @returns Mapped domain model directly.
   */
  public async analyze(
    jobId: string,
    documentName: string,
    textContent: string = "",
    requestId?: string
  ): Promise<AnalysisResultDomain> {
    throw new ProviderConfigurationError("OllaGraph provider is not configured.");
  }
}
