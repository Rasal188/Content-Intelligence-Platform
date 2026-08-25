import { Activity } from "lucide-react";
import type { AnalysisJob } from "../_types/analysis";
import { EmptyState } from "./empty-state";

interface RecentAnalysisProps {
  jobs: AnalysisJob[];
}

const TYPE_LABEL_MAP: Record<string, string> = {
  ai_detection: "AI Detection",
  plagiarism: "Plagiarism Search",
  ai_humanizer: "AI Humanizer",
  full_audit: "AI Humanizer",
};

/**
 * Data table component rendering recent analysis jobs and metrics.
 */
export function RecentAnalysis({ jobs }: RecentAnalysisProps) {
  if (jobs.length === 0) {
    return (
      <EmptyState
        title="No analyses created yet"
        description="Run an analysis above to see scores and reports."
        icon={<Activity className="h-6 w-6" />}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wider text-primary/50 bg-secondary/50">
            <tr>
              <th className="px-4 py-3 font-medium">Document / Source</th>
              <th className="px-4 py-3 font-medium">Mode</th>
              <th className="px-4 py-3 font-medium">Primary Metric</th>
              <th className="px-4 py-3 font-medium">Secondary Metric</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Completed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-primary/5 transition-colors">
                <td className="px-4 py-3 font-medium text-primary">
                  {job.documentName}
                </td>
                <td className="px-4 py-3 text-xs text-primary/70">
                  {TYPE_LABEL_MAP[job.analysisType] || job.analysisType}
                </td>
                <td className="px-4 py-3">
                  {job.result ? (
                    job.analysisType === "plagiarism" ? (
                      <div>
                        <span className="font-mono text-sm font-semibold text-green-600 dark:text-green-400">
                          {job.result.overallScore}%
                        </span>
                        <span className="text-[10px] text-primary/40 block">
                          Originality
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="font-mono text-sm font-semibold text-primary/80">
                          {job.result.aiScore}%
                        </span>
                        <span className="text-[10px] text-primary/40 block">
                          AI Likelihood
                        </span>
                      </div>
                    )
                  ) : (
                    <span className="text-primary/40">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {job.result ? (
                    job.analysisType === "plagiarism" ? (
                      <div>
                        <span className="font-mono text-sm font-semibold text-amber-600 dark:text-amber-400">
                          {job.result.plagiarismScore ?? Math.max(0, 100 - job.result.overallScore)}%
                        </span>
                        <span className="text-[10px] text-primary/40 block">
                          Plagiarism
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="font-mono text-sm font-semibold text-green-600 dark:text-green-400">
                          {Math.max(0, 100 - job.result.aiScore)}%
                        </span>
                        <span className="text-[10px] text-primary/40 block">
                          Human Likelihood
                        </span>
                      </div>
                    )
                  ) : (
                    <span className="text-primary/40">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600 ring-1 ring-inset ring-green-600/20">
                    {job.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-primary/50 font-mono">
                  {new Date(job.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
