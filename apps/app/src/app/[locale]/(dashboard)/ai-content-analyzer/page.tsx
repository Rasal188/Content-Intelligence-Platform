"use client";

import { Button } from "@v1/ui/button";
import {
  Activity,
  Clipboard,
  FileCheck,
  FileText,
  Globe,
  Play,
  ShieldAlert,
  Sparkles,
  Upload,
} from "lucide-react";
import { Header } from "../_components/header";
import { AnalysisTypeSelector } from "./_components/analysis-type-selector";
import { DocumentUpload } from "./_components/document-upload";
import { ErrorState } from "./_components/error-state";
import { LoadingState } from "./_components/loading-state";
import { PasteText } from "./_components/paste-text";
import { RecentAnalysis } from "./_components/recent-analysis";
import { RecentDocuments } from "./_components/recent-documents";
import { UrlInput } from "./_components/url-input";
import { useAnalyzer } from "./_hooks/use-analyzer";
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
  { id: "url", label: "URL Analysis", icon: Globe },
];

export default function AIContentAnalyzerPage() {
  const {
    activeTab,
    analysisType,
    selectedFile,
    pastedText,
    urlInput,
    isLoading,
    loadingStage,
    progressPercent,
    validationError,
    recentAnalyses,
    recentDocuments,
    handleTabChange,
    setAnalysisType,
    handleFileSelect,
    handleTextChange,
    handleUrlChange,
    runAnalysis,
    dismissError,
  } = useAnalyzer();

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
              label="Documents"
              value={recentDocuments.length}
              sub="Submitted items"
            />
            <StatCard
              icon={Sparkles}
              label="AI Analyses"
              value={recentAnalyses.length}
              sub="Pattern checks run"
            />
            <StatCard
              icon={ShieldAlert}
              label="Plagiarism Reports"
              value={
                recentAnalyses.filter((a) => a.analysisType !== "ai_detection")
                  .length
              }
              sub="Uniqueness audits"
            />
            <StatCard
              icon={Activity}
              label="System Status"
              value={isLoading ? "Analyzing" : "Ready"}
              sub={isLoading ? "Running pipeline" : "Idle"}
            />
          </div>
        </section>

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
                Document Workspace
              </h2>
              <p className="text-xs text-primary/60">
                Choose an input method and analysis mode to inspect content.
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
                    disabled={isLoading}
                    className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-card text-primary shadow-sm"
                        : "text-primary/60 hover:text-primary"
                    } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Tab Body & Loading View */}
          {isLoading ? (
            <LoadingState
              stage={loadingStage}
              progressPercent={progressPercent}
            />
          ) : (
            <div className="space-y-6">
              {/* Tab 1: Document Upload */}
              {activeTab === "file" && (
                <DocumentUpload
                  selectedFile={selectedFile}
                  onFileSelect={handleFileSelect}
                  disabled={isLoading}
                />
              )}

              {/* Tab 2: Paste Text */}
              {activeTab === "paste" && (
                <PasteText
                  value={pastedText}
                  onChange={handleTextChange}
                  disabled={isLoading}
                />
              )}

              {/* Tab 3: URL Input */}
              {activeTab === "url" && (
                <UrlInput
                  value={urlInput}
                  onChange={handleUrlChange}
                  disabled={isLoading}
                />
              )}

              {/* Mode Selection */}
              <AnalysisTypeSelector
                selected={analysisType}
                onSelect={setAnalysisType}
                disabled={isLoading}
              />

              {/* Submit Action Button */}
              <div className="flex justify-end border-t border-border/50 pt-4">
                <Button
                  onClick={runAnalysis}
                  disabled={isLoading}
                  className="min-w-[160px]"
                >
                  <Play className="mr-2 h-4 w-4 fill-current" />
                  Analyze Content
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Recent Results Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Recent Analyses Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-primary/60">
                Recent Analyses
              </h2>
              <span className="text-xs font-mono text-primary/40">
                {recentAnalyses.length} total
              </span>
            </div>
            <RecentAnalysis jobs={recentAnalyses} />
          </section>

          {/* Recent Documents Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-primary/60">
                Submitted Documents
              </h2>
              <span className="text-xs font-mono text-primary/40">
                {recentDocuments.length} total
              </span>
            </div>
            <RecentDocuments documents={recentDocuments} />
          </section>
        </div>
      </div>
    </div>
  );
}
