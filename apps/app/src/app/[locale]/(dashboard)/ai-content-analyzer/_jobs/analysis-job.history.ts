import type { AnalysisJobItem } from "./analysis-job.types";

/**
 * Initial sample job history entries for demonstration.
 */
const INITIAL_SAMPLE_HISTORY: AnalysisJobItem[] = [
  {
    id: "job-hist-101",
    documentId: "doc-sample-1",
    documentName: "Research_Paper_2026.docx",
    analysisType: "full_audit",
    inputSource: "file",
    status: "completed",
    progress: 100,
    currentStage: "Report Generated",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2 + 12000).toISOString(),
    startedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    finishedAt: new Date(Date.now() - 3600000 * 2 + 12000).toISOString(),
    elapsedTime: 12,
    estimatedRemaining: 0,
    workerId: "worker-node-1",
    logs: [
      {
        id: "log-1",
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        stage: "Queued",
        message: "Job enqueued",
        level: "info",
      },
      {
        id: "log-2",
        timestamp: new Date(Date.now() - 3600000 * 2 + 12000).toISOString(),
        stage: "Completed",
        message: "Analysis completed successfully",
        level: "success",
      },
    ],
    result: {
      jobId: "job-hist-101",
      overallScore: 94,
      aiScore: 8,
      plagiarismScore: 2,
      readabilityScore: 88,
      wordCount: 2450,
      characterCount: 16200,
      summary:
        "High originality detected. Clear syntax structure and low neural likelihood.",
      completedAt: new Date(Date.now() - 3600000 * 2 + 12000).toISOString(),
    },
  },
];

/**
 * In-memory job history storage manager.
 */
export class AnalysisJobHistory {
  private historyJobs: AnalysisJobItem[] = [...INITIAL_SAMPLE_HISTORY];

  /**
   * Retrieves all completed or terminal jobs from history.
   * @returns Array of AnalysisJobItems.
   */
  public getJobs(): AnalysisJobItem[] {
    return [...this.historyJobs];
  }

  /**
   * Finds a specific job by ID.
   * @param id Job ID.
   * @returns AnalysisJobItem or undefined.
   */
  public getJob(id: string): AnalysisJobItem | undefined {
    return this.historyJobs.find((j) => j.id === id);
  }

  /**
   * Adds or updates a job in history.
   * @param job AnalysisJobItem to add or update.
   */
  public addOrUpdateJob(job: AnalysisJobItem): void {
    const idx = this.historyJobs.findIndex((j) => j.id === job.id);
    if (idx !== -1) {
      this.historyJobs[idx] = { ...job };
    } else {
      this.historyJobs.unshift({ ...job });
    }
  }

  /**
   * Deletes a job from history by ID.
   * @param id Job ID to delete.
   * @returns Boolean indicating whether job was found and deleted.
   */
  public deleteJob(id: string): boolean {
    const idx = this.historyJobs.findIndex((j) => j.id === id);
    if (idx === -1) return false;
    this.historyJobs.splice(idx, 1);
    return true;
  }

  /**
   * Duplicates a job entry creating a new queued copy payload.
   * @param id Job ID to duplicate.
   * @returns New duplicated AnalysisJobItem or null.
   */
  public duplicateJob(id: string): AnalysisJobItem | null {
    const existing = this.getJob(id);
    if (!existing) return null;
    const copyId = `job-${Date.now().toString().slice(-4)}`;
    const duplicate: AnalysisJobItem = {
      ...existing,
      id: copyId,
      status: "queued",
      progress: 0,
      currentStage: "Queued for processing",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startedAt: undefined,
      finishedAt: undefined,
      elapsedTime: 0,
      estimatedRemaining: 15,
      logs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          stage: "Queued",
          message: "Duplicated job added to queue",
          level: "info",
        },
      ],
      result: undefined,
    };
    return duplicate;
  }

  /**
   * Clears all jobs from history.
   */
  public clearHistory(): void {
    this.historyJobs = [];
  }
}
