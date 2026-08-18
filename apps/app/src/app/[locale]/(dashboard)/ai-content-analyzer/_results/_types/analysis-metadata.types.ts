/**
 * Technical metadata detailing the execution environment and engine versions.
 */
export interface AnalysisMetadata {
  schemaVersion: string;
  engineVersion: string;
  providerVersion: string;
  providerName: string;
  executionTimeMs: number;
  generatedAt: string;
  checksum: string;
  processingTimeSeconds: number;
  isMockData: boolean;
  requestId?: string;
  providerRequestId?: string;
  providerModel?: string;
  promptVersion?: string;
  failureReason?: string;
  analysisVersion?: string;
  processingTimestamp?: string;
  documentLanguage?: string;
  documentComplexity?: string;
  analysisDepth?: string;
}
