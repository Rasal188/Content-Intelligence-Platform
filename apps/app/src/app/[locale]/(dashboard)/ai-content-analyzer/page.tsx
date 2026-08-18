"use client";

import { Button } from "@v1/ui/button";
import {
  Activity,
  Clipboard,
  FileText,
  Loader2,
  Play,
  ShieldAlert,
  Sparkles,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { Header } from "../_components/header";
import { ActiveJobCard } from "./_components/active-job-card";
import { AnalysisTypeSelector } from "./_components/analysis-type-selector";
import { DocumentUpload } from "./_components/document-upload";
import { ErrorState } from "./_components/error-state";
import { JobHistory } from "./_components/job-history";
import { PasteText } from "./_components/paste-text";
import { QueuedJobs } from "./_components/queued-jobs";
import { useAnalyzer } from "./_hooks/use-analyzer";
import type { AnalysisJobItem } from "./_jobs/analysis-job.types";
import { ResultViewer } from "./_results/_components/result-viewer";
import type { InputSource } from "./_types/analysis";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-2 flex items-center gap-2 text-primary/50">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-2xl font-semibold text-primary">{value}</p>
      {sub && <p className="mt-1 text-xs text-primary/40">{sub}</p>}
    </div>
  );
}

const TAB_CONFIG: Array<{
  id: InputSource;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "file", label: "Upload Document", icon: Upload },
  { id: "paste", label: "Paste Text", icon: Clipboard },
];

export default function AIContentAnalyzerPage() {
  const {
    activeTab,
    analysisType,
    selectedFile,
    pastedText,
    validationError,
    activeJob,
    queuedJobs,
    historyJobs,
    handleTabChange,
    setAnalysisType,
    handleFileSelect,
    handleTextChange,
    runAnalysis,
    cancelJob,
    deleteHistoryJob,
    duplicateJob,
    clearHistory,
    dismissError,
  } = useAnalyzer();

  const [reportJob, setReportJob] = useState<AnalysisJobItem | null>(null);

  return (
    <div className="flex min-h-full w-full flex-col bg-secondary dark:bg-black">
      <Header
        title="AI Content Analyzer"
        description="Analyze documents, detect AI-generated content, perform plagiarism checks, and manage reports."
      />

      <div className="mx-auto w-full max-w-screen-xl space-y-8 px-6 py-8">
        {/* Quick Statistics Overview */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-primary/60">Overview</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={FileText}
              label="Total Jobs"
              value={historyJobs.length + (activeJob ? 1 : 0) + queuedJobs.length}
              sub="Analysis items"
            />
            <StatCard
              icon={Sparkles}
              label="Active & Queued"
              value={(activeJob ? 1 : 0) + queuedJobs.length}
              sub="Engine queue"
            />
            <StatCard
              icon={ShieldAlert}
              label="Completed Audits"
              value={historyJobs.filter((j) => j.status === "completed").length}
              sub="Finished checks"
            />
            <StatCard
              icon={Activity}
              label="Engine Status"
              value={activeJob ? "Processing" : "Idle"}
              sub={activeJob ? `Job ${activeJob.id}` : "Ready for jobs"}
            />
          </div>
        </section>

        {/* Active Job Execution Card */}
        {activeJob && (
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-primary/60">
              Active Processing Job
            </h2>
            <ActiveJobCard job={activeJob} onCancel={cancelJob} />
          </section>
        )}

        {/* Queued Jobs List */}
        {queuedJobs.length > 0 && (
          <section className="space-y-3">
            <QueuedJobs jobs={queuedJobs} onCancel={cancelJob} />
          </section>
        )}

        {/* Validation Error Banner */}
        {validationError && (
          <ErrorState message={validationError} onDismiss={dismissError} />
        )}

        {/* Main Document Workspace Card */}
        <section className="rounded-lg border border-border bg-card p-6 space-y-6">
          {/* Workspace Tabs Header */}
          <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-medium text-primary">
                Create Analysis Job
              </h2>
              <p className="text-xs text-primary/60">
                Choose an input method and analysis mode to submit a new job to the engine.
              </p>
            </div>

            {/* Input Method Navigation Tabs */}
            <div className="flex rounded-lg border border-border bg-secondary/50 p-1">
              {TAB_CONFIG.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-card text-primary shadow-sm"
                        : "text-primary/60 hover:text-primary"
                    } cursor-pointer`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Input Body */}
          <div className="space-y-6">
            {/* Tab 1: Document Upload */}
            {activeTab === "file" && (
              <DocumentUpload
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
              />
            )}

            {/* Tab 2: Paste Text */}
            {activeTab === "paste" && (
              <PasteText value={pastedText} onChange={handleTextChange} />
            )}

            {/* Mode Selection */}
            <AnalysisTypeSelector
              selected={analysisType}
              onSelect={setAnalysisType}
            />

            {/* Submit Action Button */}
            <div className="flex justify-end border-t border-border/50 pt-4">
              <Button onClick={runAnalysis} className="min-w-[160px]" disabled={!!activeJob}>
                {activeJob ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4 fill-current" />
                    Analyze Content
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* Job History Section */}
        <section className="space-y-3">
          <JobHistory
            jobs={historyJobs}
            onDuplicate={duplicateJob}
            onDelete={deleteHistoryJob}
            onClearHistory={clearHistory}
            onViewReport={(job) => setReportJob(job)}
          />
        </section>
      </div>

      {/* Result Viewer Report Modal */}
      {reportJob && (
        <ResultViewer
          jobId={reportJob.id}
          documentName={reportJob.documentName}
          textContent={reportJob.textContent}
          job={reportJob}
          onClose={() => setReportJob(null)}
        />
      )}
    </div>
  );
}
