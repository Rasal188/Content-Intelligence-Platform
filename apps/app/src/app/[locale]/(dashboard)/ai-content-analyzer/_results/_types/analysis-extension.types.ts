/**
 * Extensible plugin data model reserved for future analysis sub-modules.
 */
export interface AnalysisExtensions {
  grammar?: Record<string, unknown>;
  ocr?: Record<string, unknown>;
  factChecking?: Record<string, unknown>;
  citation?: Record<string, unknown>;
  seo?: Record<string, unknown>;
  writingStyle?: Record<string, unknown>;
  hallucination?: Record<string, unknown>;
  tone?: Record<string, unknown>;
  forensics?: Record<string, unknown>;
}
