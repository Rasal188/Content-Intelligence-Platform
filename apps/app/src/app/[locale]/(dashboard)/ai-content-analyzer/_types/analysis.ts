/**
 * Domain model representing an uploaded or submitted document.
 */
export interface DocumentItem {
  id: string;
  name: string;
  size: number;
  extension: string;
  mimeType: string;
  uploadedAt: string;
  source: InputSource;
  textContent?: string;
  url?: string;
}

/**
 * Supported input sources for analysis.
 */
export type InputSource = "file" | "paste";

/**
 * Supported analysis types/modes.
 */
export type AnalysisType = "ai_detection" | "plagiarism" | "ai_humanizer" | "full_audit";

/**
 * Status states for an analysis job.
 */
export type AnalysisStatus = "idle" | "queued" | "processing" | "completed" | "failed";

/**
 * Animated processing stage for progressive loading.
 */
export type LoadingStage =
  | "idle"
  | "uploading"
  | "extracting_text"
  | "preparing_analysis"
  | "running_detection"
  | "generating_report"
  | "completed";

/**
 * Current upload state for file dropzone.
 */
export type UploadState = "idle" | "dragging" | "selected" | "error";

/**
 * Request payload submitted to the analysis service.
 */
export interface AnalysisRequest {
  source: InputSource;
  analysisType: AnalysisType;
  file?: File;
  text?: string;
  url?: string;
}

/**
 * Result returned upon completing an analysis request.
 */
export interface AnalysisResult {
  jobId: string;
  overallScore: number;
  aiScore: number;
  plagiarismScore: number;
  readabilityScore: number;
  wordCount: number;
  characterCount: number;
  summary: string;
  completedAt: string;
  humanizedText?: string;
  originalText?: string;
  humanizedAiScore?: number;
  beforeAiScore?: number;
}

/**
 * Full domain record of an analysis job.
 */
export interface AnalysisJob {
  id: string;
  documentName: string;
  source: InputSource;
  analysisType: AnalysisType;
  status: AnalysisStatus;
  createdAt: string;
  result?: AnalysisResult;
  error?: string;
  humanizedText?: string;
  isHumanized?: boolean;
}

/**
 * Validation result response model.
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}
