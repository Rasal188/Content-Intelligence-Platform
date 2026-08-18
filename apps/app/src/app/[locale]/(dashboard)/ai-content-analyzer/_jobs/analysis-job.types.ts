import type {
  AnalysisRequest,
  AnalysisResult,
  AnalysisType,
  InputSource,
} from "../_types/analysis";

/**
 * All allowed states for an Analysis Job in the state machine.
 */
export type JobState =
  | "idle"
  | "queued"
  | "preparing"
  | "running"
  | "generating_report"
  | "completed"
  | "cancelled"
  | "failed"
  | "retrying";

/**
 * Log entry level for timeline events.
 */
export type LogLevel = "info" | "success" | "warning" | "error";

/**
 * Individual log or timeline event entry for a job.
 */
export interface JobLogItem {
  id: string;
  timestamp: string;
  stage: string;
  message: string;
  level: LogLevel;
}

/**
 * Full domain entity representing an Analysis Job.
 */
export interface AnalysisJobItem {
  id: string;
  documentId: string;
  documentName: string;
  analysisType: AnalysisType;
  inputSource: InputSource;
  status: JobState;
  progress: number;
  currentStage: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  finishedAt?: string;
  elapsedTime: number;
  estimatedRemaining: number;
  workerId: string;
  logs: JobLogItem[];
  result?: AnalysisResult;
  error?: string;
  originalRequest?: AnalysisRequest;
  textContent?: string;
  humanizedText?: string;
  isHumanized?: boolean;
}

/**
 * Event listener callback for job engine state updates.
 */
export type JobEngineListener = (
  activeJob: AnalysisJobItem | null,
  queuedJobs: AnalysisJobItem[],
  historyJobs: AnalysisJobItem[],
) => void;
