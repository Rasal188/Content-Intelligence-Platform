import type {
  AnalysisJob,
  AnalysisRequest,
  AnalysisResult,
  DocumentItem,
  LoadingStage,
} from "../../_types/analysis";
import { formatFileSize, getFileExtension } from "../../_utils/file-utils";
import { getTextMetrics } from "../../_utils/validators";

/**
 * Service provider interface for analysis operations.
 */
export interface IAnalysisProvider {
  submitAnalysis(
    request: AnalysisRequest,
    onProgress?: (stage: LoadingStage, percent: number) => void,
  ): Promise<AnalysisJob>;
  getRecentAnalyses(): Promise<AnalysisJob[]>;
  getRecentDocuments(): Promise<DocumentItem[]>;
}

/**
 * Initial in-memory mock document dataset.
 */
const MOCK_DOCUMENTS: DocumentItem[] = [
  {
    id: "doc-1",
    name: "Research_Draft_2026.docx",
    size: 2450000,
    extension: ".docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    uploadedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    source: "file",
  },
  {
    id: "doc-2",
    name: "Article_Submission.pdf",
    size: 1120000,
    extension: ".pdf",
    mimeType: "application/pdf",
    uploadedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    source: "file",
  },
];

/**
 * Initial in-memory mock analysis job dataset.
 */
const MOCK_JOBS: AnalysisJob[] = [
  {
    id: "job-101",
    documentName: "Research_Draft_2026.docx",
    source: "file",
    analysisType: "full_audit",
    status: "completed",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    result: {
      jobId: "job-101",
      overallScore: 92,
      aiScore: 12,
      plagiarismScore: 4,
      readabilityScore: 85,
      wordCount: 3420,
      characterCount: 21500,
      summary:
        "High originality detected. Minor similarity flagged in standard bibliography entries.",
      completedAt: new Date(Date.now() - 3600000 * 2 + 15000).toISOString(),
    },
  },
  {
    id: "job-102",
    documentName: "Article_Submission.pdf",
    source: "file",
    analysisType: "ai_detection",
    status: "completed",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    result: {
      jobId: "job-102",
      overallScore: 68,
      aiScore: 78,
      plagiarismScore: 2,
      readabilityScore: 74,
      wordCount: 1850,
      characterCount: 11200,
      summary:
        "Substantial AI pattern probability detected in sections 2 and 4.",
      completedAt: new Date(Date.now() - 3600000 * 5 + 12000).toISOString(),
    },
  },
];

/**
 * Frontend-only mock provider implementation simulating realistic async analysis operations.
 */
export class MockAnalysisProvider implements IAnalysisProvider {
  private jobs: AnalysisJob[] = [...MOCK_JOBS];
  private documents: DocumentItem[] = [...MOCK_DOCUMENTS];

  /**
   * Submits an analysis request and runs simulated progressive loading stages.
   * @param request AnalysisRequest payload.
   * @param onProgress Optional progress callback.
   * @returns Promise resolving to the completed AnalysisJob.
   */
  async submitAnalysis(
    request: AnalysisRequest,
    onProgress?: (stage: LoadingStage, percent: number) => void,
  ): Promise<AnalysisJob> {
    const docName = this.extractDocumentName(request);
    const textContent = this.extractTextContent(request);
    const metrics = getTextMetrics(textContent);

    const stages: Array<{ stage: LoadingStage; percent: number; delay: number }> =
      [
        { stage: "uploading", percent: 20, delay: 600 },
        { stage: "extracting_text", percent: 40, delay: 600 },
        { stage: "preparing_analysis", percent: 60, delay: 600 },
        { stage: "running_detection", percent: 85, delay: 800 },
        { stage: "generating_report", percent: 100, delay: 500 },
      ];

    for (const step of stages) {
      if (onProgress) {
        onProgress(step.stage, step.percent);
      }
      await new Promise((res) => setTimeout(res, step.delay));
    }

    const jobId = `job-${Date.now().toString().slice(-4)}`;
    const result: AnalysisResult = {
      jobId,
      overallScore: Math.floor(Math.random() * 25) + 75,
      aiScore: Math.floor(Math.random() * 30),
      plagiarismScore: Math.floor(Math.random() * 10),
      readabilityScore: Math.floor(Math.random() * 20) + 70,
      wordCount: metrics.wordCount || 850,
      characterCount: metrics.characterCount || 5200,
      summary:
        "Analysis complete. Content verified against AI pattern indexes and web sources.",
      completedAt: new Date().toISOString(),
    };

    const newJob: AnalysisJob = {
      id: jobId,
      documentName: docName,
      source: request.source,
      analysisType: request.analysisType,
      status: "completed",
      createdAt: new Date().toISOString(),
      result,
    };

    const newDoc: DocumentItem = {
      id: `doc-${Date.now().toString().slice(-4)}`,
      name: docName,
      size: request.file ? request.file.size : textContent.length,
      extension: request.file ? getFileExtension(request.file.name) : ".txt",
      mimeType: request.file ? request.file.type : "text/plain",
      uploadedAt: new Date().toISOString(),
      source: request.source,
      textContent,
      url: request.url,
    };

    this.jobs.unshift(newJob);
    this.documents.unshift(newDoc);

    return newJob;
  }

  /**
   * Retrieves array of recent analysis jobs.
   */
  async getRecentAnalyses(): Promise<AnalysisJob[]> {
    return [...this.jobs];
  }

  /**
   * Retrieves array of recent documents.
   */
  async getRecentDocuments(): Promise<DocumentItem[]> {
    return [...this.documents];
  }

  private extractDocumentName(request: AnalysisRequest): string {
    if (request.source === "file" && request.file) {
      return request.file.name;
    }
    if (request.source === "url" && request.url) {
      try {
        const u = new URL(request.url);
        return u.hostname + (u.pathname.length > 1 ? u.pathname.slice(0, 15) : "");
      } catch {
        return "Web Document";
      }
    }
    return "Pasted Snippet.txt";
  }

  private extractTextContent(request: AnalysisRequest): string {
    if (request.source === "paste" && request.text) {
      return request.text;
    }
    if (request.source === "url" && request.url) {
      return `Sample extracted text content from web address: ${request.url}`;
    }
    if (request.file) {
      return `Sample text content extracted from file: ${request.file.name} (${formatFileSize(request.file.size)})`;
    }
    return "";
  }
}
