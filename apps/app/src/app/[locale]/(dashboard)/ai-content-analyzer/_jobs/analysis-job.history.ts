import type { AnalysisJobItem } from "./analysis-job.types";

/**
 * Initial sample job history entries for demonstration.
 */
const INITIAL_SAMPLE_HISTORY: AnalysisJobItem[] = [];

/**
 * In-memory job history storage manager.
 */
export class AnalysisJobHistory {
  private historyJobs: AnalysisJobItem[] = [];

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
