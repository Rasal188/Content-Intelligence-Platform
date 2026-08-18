import type { AnalysisJobItem } from "./analysis-job.types";

/**
 * FIFO Queue manager for Analysis Jobs. Enforces single concurrent job execution.
 */
export class AnalysisJobQueue {
  private queue: AnalysisJobItem[] = [];
  private activeJobId: string | null = null;

  /**
   * Enqueues a new job into the FIFO queue.
   * @param job AnalysisJobItem to enqueue.
   */
  public enqueue(job: AnalysisJobItem): void {
    this.queue.push(job);
  }

  /**
   * Removes and returns the next job from the queue.
   * @returns Next AnalysisJobItem or null if queue is empty.
   */
  public dequeue(): AnalysisJobItem | null {
    if (this.queue.length === 0) return null;
    return this.queue.shift() ?? null;
  }

  /**
   * Peek at the next job in the queue without removing it.
   * @returns Next AnalysisJobItem or null.
   */
  public peek(): AnalysisJobItem | null {
    return this.queue[0] ?? null;
  }

  /**
   * Removes a queued job by ID before execution starts.
   * @param id Job ID to remove.
   * @returns Removed AnalysisJobItem or null.
   */
  public remove(id: string): AnalysisJobItem | null {
    const idx = this.queue.findIndex((j) => j.id === id);
    if (idx === -1) return null;
    const [removed] = this.queue.splice(idx, 1);
    return removed ?? null;
  }

  /**
   * Sets the currently active running job ID.
   * @param id Active job ID or null.
   */
  public setActiveJobId(id: string | null): void {
    this.activeJobId = id;
  }

  /**
   * Returns the currently active running job ID.
   * @returns Active job ID string or null.
   */
  public getActiveJobId(): string | null {
    return this.activeJobId;
  }

  /**
   * Returns a copy of the pending queue array.
   * @returns Array of pending AnalysisJobItems.
   */
  public getQueuedJobs(): AnalysisJobItem[] {
    return [...this.queue];
  }

  /**
   * Returns the length of the queue.
   * @returns Number of pending jobs.
   */
  public size(): number {
    return this.queue.length;
  }

  /**
   * Clears all pending queued jobs.
   */
  public clear(): void {
    this.queue = [];
    this.activeJobId = null;
  }
}
