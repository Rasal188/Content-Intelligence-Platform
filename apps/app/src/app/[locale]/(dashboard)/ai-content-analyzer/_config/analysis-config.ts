/**
 * Feature flag configuration for the AI Content Analyzer module.
 */
export const ANALYSIS_FEATURE_CONFIG = {
  enableAiDetection: true,
  enablePlagiarismCheck: true,
  enableFullAudit: true,
  enableUrlAnalysis: true,
  enablePasteText: true,
  enableDocumentUpload: true,
  enableOcrSupport: false,
  enableBatchUpload: false,
  enableExportPdf: false,
} as const;

export type AnalysisFeatureConfig = typeof ANALYSIS_FEATURE_CONFIG;
