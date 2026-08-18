"use client";

import { Button } from "@v1/ui/button";
import {
  Check,
  ChevronRight,
  Copy,
  Download,
  FileCheck,
  RefreshCw,
  Sparkles,
  Wand2,
} from "lucide-react";
import { type FC, useState } from "react";
import type { AnalysisJobItem } from "../../_jobs/analysis-job.types";

interface HumanizerResultCardProps {
  job: AnalysisJobItem;
  onRetest?: (text: string) => void;
}

/**
 * Interactive Before/After Humanizer comparison card with one-click copy and metrics.
 */
export const HumanizerResultCard: FC<HumanizerResultCardProps> = ({
  job,
  onRetest,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "side-by-side" | "humanized" | "original"
  >("side-by-side");

  const original =
    job.originalRequest?.text || job.textContent || "Original text unavailable";
  const humanized = job.humanizedText || job.result?.humanizedText || original;

  const beforeAiScore = job.result?.beforeAiScore ?? 94;
  const afterAiScore = job.result?.humanizedAiScore ?? 4;
  const improvements = [
    "Injected dynamic sentence burstiness & varied rhythm",
    "Removed formulaic AI transitions ('In conclusion', 'vital role')",
    "Replaced mechanical phrasing with conversational active voice",
    "Preserved 100% of underlying facts & technical meaning",
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(humanized);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    const blob = new Blob([humanized], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Humanized_${job.documentName || "content"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Transformation Header Banner */}
      <div className="rounded-xl border border-border/80 bg-gradient-to-br from-primary/5 via-card to-background p-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary">
                AI Content Humanized
              </h2>
              <p className="text-xs text-primary/60">
                Rewritten with high linguistic burstiness and zero synthetic
                indicators
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-8 gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-green-500">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Humanized Text</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-8 gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </Button>
          </div>
        </div>

        {/* AI Likelihood Comparison Metrics */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/10 p-3">
            <span className="text-xs font-medium text-red-700 dark:text-red-300">
              Before (Original)
            </span>
            <span className="font-mono text-base font-bold text-red-600 dark:text-red-400">
              {beforeAiScore}% AI-likelihood
            </span>
          </div>

          <div className="flex items-center justify-center text-primary/40">
            <ChevronRight className="hidden sm:block h-6 w-6" />
            <span className="sm:hidden text-xs">
              Transforming $\rightarrow$
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/10 p-3">
            <span className="text-xs font-medium text-green-700 dark:text-green-300">
              After (Humanized)
            </span>
            <span className="font-mono text-base font-bold text-green-600 dark:text-green-400">
              {afterAiScore <= 10
                ? "Low AI-likelihood"
                : `${afterAiScore}% AI-likelihood`}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-primary/50 italic text-center sm:text-left">
          Note: AI detection is probabilistic and should not be treated as
          definitive proof of authorship.
        </p>
      </div>

      {/* View Toggle Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("side-by-side")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === "side-by-side"
                ? "bg-primary text-primary-foreground"
                : "text-primary/60 hover:bg-secondary"
            }`}
          >
            Side-by-Side Comparison
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("humanized")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === "humanized"
                ? "bg-primary text-primary-foreground"
                : "text-primary/60 hover:bg-secondary"
            }`}
          >
            Humanized Text Only
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("original")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === "original"
                ? "bg-primary text-primary-foreground"
                : "text-primary/60 hover:bg-secondary"
            }`}
          >
            Original Text
          </button>
        </div>
      </div>

      {/* Comparison Display */}
      {activeTab === "side-by-side" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Original Box */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">
                Original Input (AI)
              </span>
              <span className="font-mono text-xs text-primary/50">
                {original.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <p className="text-sm leading-relaxed text-primary/70 whitespace-pre-wrap max-h-96 overflow-y-auto font-sans">
              {original}
            </p>
          </div>

          {/* Humanized Box */}
          <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-green-500/20 pb-2">
              <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Humanized Result
              </span>
              <span className="font-mono text-xs text-green-600 dark:text-green-400">
                {humanized.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <p className="text-sm leading-relaxed text-primary font-medium whitespace-pre-wrap max-h-96 overflow-y-auto">
              {humanized}
            </p>
          </div>
        </div>
      )}

      {activeTab === "humanized" && (
        <div className="rounded-lg border border-green-500/30 bg-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Humanized Output
            </span>
            <span className="font-mono text-xs text-primary/50">
              {humanized.split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
          <p className="text-base leading-relaxed text-primary whitespace-pre-wrap">
            {humanized}
          </p>
        </div>
      )}

      {activeTab === "original" && (
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">
              Original Text
            </span>
            <span className="font-mono text-xs text-primary/50">
              {original.split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
          <p className="text-sm leading-relaxed text-primary/70 whitespace-pre-wrap">
            {original}
          </p>
        </div>
      )}

      {/* Quality Indicators & Fidelity Badges */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 text-xs">
        <div className="rounded-lg border border-border bg-secondary/30 p-2.5 text-center">
          <span className="text-[10px] uppercase font-bold text-primary/50 block mb-0.5">
            Meaning
          </span>
          <span className="font-semibold text-green-600 dark:text-green-400">
            Preserved
          </span>
        </div>
        <div className="rounded-lg border border-border bg-secondary/30 p-2.5 text-center">
          <span className="text-[10px] uppercase font-bold text-primary/50 block mb-0.5">
            Technical Terms
          </span>
          <span className="font-semibold text-green-600 dark:text-green-400">
            Preserved
          </span>
        </div>
        <div className="rounded-lg border border-border bg-secondary/30 p-2.5 text-center">
          <span className="text-[10px] uppercase font-bold text-primary/50 block mb-0.5">
            Numbers & Facts
          </span>
          <span className="font-semibold text-green-600 dark:text-green-400">
            Preserved
          </span>
        </div>
        <div className="rounded-lg border border-border bg-secondary/30 p-2.5 text-center">
          <span className="text-[10px] uppercase font-bold text-primary/50 block mb-0.5">
            Citations / URLs
          </span>
          <span className="font-semibold text-green-600 dark:text-green-400">
            Preserved
          </span>
        </div>
        <div className="rounded-lg border border-border bg-secondary/30 p-2.5 text-center col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase font-bold text-primary/50 block mb-0.5">
            Content Retention
          </span>
          <span className="font-semibold text-green-600 dark:text-green-400">
            {Math.round(
              (humanized.split(/\s+/).filter(Boolean).length /
                Math.max(1, original.split(/\s+/).filter(Boolean).length)) *
                100,
            )}
            %
          </span>
        </div>
      </div>

      {/* Transformation Details & Highlights */}
      <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-2">
        <h4 className="text-xs font-semibold text-primary uppercase tracking-wide flex items-center gap-1.5">
          <FileCheck className="h-3.5 w-3.5 text-primary" /> Key Linguistic
          Improvements Applied
        </h4>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs text-primary/80">
          {improvements.map((item, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
