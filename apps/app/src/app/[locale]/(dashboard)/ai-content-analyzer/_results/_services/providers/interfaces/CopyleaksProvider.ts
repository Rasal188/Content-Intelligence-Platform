import { ProviderConfigurationError } from "./ProviderConfigurationError";
import type { IAnalysisProvider } from "./IAnalysisProvider";
import type { AnalysisResultDomain } from "../../../_types/analysis-result.types";

/**
 * Placeholder for future Copyleaks Provider integration.
 */
export class CopyleaksProvider implements IAnalysisProvider {
  public async analyze(
    jobId: string,
    documentName: string,
    textContent: string,
    requestId?: string
  ): Promise<AnalysisResultDomain> {
    throw new ProviderConfigurationError("Copyleaks provider is not configured.");
  }
}
