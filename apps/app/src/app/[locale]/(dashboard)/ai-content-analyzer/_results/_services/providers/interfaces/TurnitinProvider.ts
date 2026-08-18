import { ProviderConfigurationError } from "./ProviderConfigurationError";
import type { IAnalysisProvider } from "./IAnalysisProvider";
import type { AnalysisResultDomain } from "../../../_types/analysis-result.types";

/**
 * Placeholder for future Turnitin Provider integration.
 */
export class TurnitinProvider implements IAnalysisProvider {
  public async analyze(
    jobId: string,
    documentName: string,
    textContent: string,
    requestId?: string
  ): Promise<AnalysisResultDomain> {
    throw new ProviderConfigurationError("Turnitin provider is not configured.");
  }
}
