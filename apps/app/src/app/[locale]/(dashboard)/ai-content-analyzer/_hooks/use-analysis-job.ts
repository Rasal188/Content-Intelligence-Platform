"use client";

import { useEffect, useState } from "react";
import { getAnalysisJobService } from "../_jobs/analysis-job.service";
import type { AnalysisJobItem } from "../_jobs/analysis-job.types";
import type { AnalysisRequest } from "../_types/analysis";

/**
 * Custom React hook providing reactive access to active, queued, and history jobs from the Analysis Job Engine.
 */
export function useAnalysisJob() {
  const service = getAnalysisJobService();

  const [activeJob, setActiveJob] = useState<AnalysisJobItem | null>(null);
  const [queuedJobs, setQueuedJobs] = useState<AnalysisJobItem[]>([]);
  const [historyJobs, setHistoryJobs] = useState<AnalysisJobItem[]>([]);

  useEffect(() => {
    const unsubscribe = service.subscribe((active, queued, history) => {
      setActiveJob(active);
      setQueuedJobs(queued);
      setHistoryJobs(history);
    });

    return () => {
      unsubscribe();
    };
  }, [service]);

  const submitJob = (request: AnalysisRequest): AnalysisJobItem => {
    return service.createAndEnqueueJob(request);
  };

  const cancelJob = (jobId: string) => {
    service.cancelJob(jobId);
  };

  const deleteHistoryJob = (jobId: string) => {
    service.deleteHistoryJob(jobId);
  };

  const duplicateJob = (jobId: string) => {
    service.duplicateJob(jobId);
  };

  const clearHistory = () => {
    service.clearHistory();
  };

  return {
    activeJob,
    queuedJobs,
    historyJobs,
    submitJob,
    cancelJob,
    deleteHistoryJob,
    duplicateJob,
    clearHistory,
  };
}
