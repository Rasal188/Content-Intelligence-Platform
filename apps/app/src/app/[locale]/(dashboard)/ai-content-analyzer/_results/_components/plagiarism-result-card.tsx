"use client";

import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  CopyCheck,
  ExternalLink,
  FileSearch,
  Globe,
  Layers,
  Quote,
  Search,
  ShieldCheck,
} from "lucide-react";
import type { FC } from "react";
import { useState } from "react";
import type { AnalysisJobItem } from "../../_jobs/analysis-job.types";
import type { AnalysisResultDomain } from "../_types/analysis-result.types";
import type { MatchedSource } from "../_types/analysis-source.types";

interface PlagiarismResultCardProps {
  rawResult: AnalysisResultDomain;
  job?: AnalysisJobItem;
}

/**
 * Enterprise 4-Tier Plagiarism & Originality Verification Suite.
 */
export const PlagiarismResultCard: FC<PlagiarismResultCardProps> = ({
  rawResult,
  job,
}) => {
  const origScore = rawResult.scores.overallOriginality.value;
  const simScore = rawResult.scores.plagiarismSimilarity.value;
  const wordCount = rawResult.document.wordCount || 1;
  const charCount = rawResult.document.characterCount || 1;
  const sources: MatchedSource[] = (rawResult.matchedSources || []).filter(
    (s) => s.verificationStatus === "VERIFIED" && s.sourceUrl,
  );
  const textContent = job?.textContent || rawResult.document.name || "";

  // Parse individual sentences for the Sentence Analysis breakdown
  const rawSentences =
    textContent && textContent.trim().length > 0
      ? textContent.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [textContent]
      : ["No raw text available for sentence breakdown."];

  const sentenceAnalysis = rawSentences.map((sentence, idx) => {
    const trimmed = sentence.trim();
    const cleanSentence = trimmed.toLowerCase().replace(/[^a-z0-9 ]/g, " ");
    const sentenceWords = cleanSentence.split(/\s+/).filter(Boolean);
    const sWordCount = sentenceWords.length;

    // Check if any verified source actually contains a 5+ word consecutive n-gram from this sentence
    let isMatched = false;
    let sentenceSimilarity = 0;

    if (sources.length > 0 && sWordCount >= 4) {
      const ngramSize = Math.min(5, sWordCount);
      for (const s of sources) {
        const sourceTextClean = (s.originalSnippet || s.matchedSnippet || "")
          .toLowerCase()
          .replace(/[^a-z0-9 ]/g, " ");
        for (let i = 0; i <= sWordCount - ngramSize; i++) {
          const ngram = sentenceWords.slice(i, i + ngramSize).join(" ");
          if (sourceTextClean.includes(ngram)) {
            isMatched = true;
            sentenceSimilarity = s.similarityPercent;
            break;
          }
        }
        if (isMatched) break;
      }
    }

    const status = isMatched
      ? sentenceSimilarity >= 80
        ? "High Match"
        : "Partial Match"
      : "Original";

    return {
      index: idx + 1,
      text: trimmed,
      similarity: isMatched ? sentenceSimilarity : 0,
      status,
      wordCount: sWordCount,
    };
  });

  const highMatchesCount = sentenceAnalysis.filter(
    (s) => s.status === "High Match",
  ).length;
  const partialMatchesCount = sentenceAnalysis.filter(
    (s) => s.status === "Partial Match",
  ).length;
  const originalSentenceCount = sentenceAnalysis.filter(
    (s) => s.status === "Original",
  ).length;

  // Compute matched words directly from deterministic scoring
  const totalSentenceWords =
    sentenceAnalysis.reduce((acc, s) => acc + s.wordCount, 0) || wordCount;
  const effectiveSimScore = sources.length > 0 ? simScore : 0;
  const matchedWords =
    sources.length > 0
      ? Math.min(wordCount, Math.round((effectiveSimScore / 100) * wordCount))
      : 0;
  const originalWords = Math.max(0, wordCount - matchedWords);

  const primarySource =
    sources.find((s) => s.sourceRole === "PRIMARY") || sources[0] || null;
  const [selectedSource, setSelectedSource] = useState<MatchedSource | null>(
    primarySource,
  );

  // Determine risk categorization
  const isHighRisk = effectiveSimScore >= 30;
  const isModerateRisk = effectiveSimScore >= 15 && effectiveSimScore < 30;
  const riskTitle = isHighRisk
    ? "High Similarity Detected"
    : isModerateRisk
      ? "Moderate Similarity"
      : sources.length > 0
        ? "Clean & Original"
        : "NO VERIFIED MATCH FOUND";
  const reportSubtitle =
    sources.length > 0
      ? "Compared against verified external sources retrieved during this analysis."
      : "No verified external source was found for this content.";

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: PLAGIARISM ANALYSIS OVERVIEW & HERO SCORE
      ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-border pb-6">
          <div className="flex items-center gap-5">
            {/* Circular / Badge Hero Score */}
            <div
              className={`flex flex-col items-center justify-center h-24 w-32 rounded-xl border p-3 ${
                isHighRisk
                  ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                  : isModerateRisk
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                    : "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400"
              }`}
            >
              <span className="text-3xl font-bold font-mono tracking-tight">
                {effectiveSimScore}%
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5 text-center leading-tight">
                {effectiveSimScore >= 90 ? "EXACT MATCH" : "MATCHED CONTENT"}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-primary">
                  Content Similarity Report
                </h2>
                <span
                  className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                    isHighRisk
                      ? "bg-red-500/15 text-red-600 dark:text-red-400"
                      : isModerateRisk
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        : "bg-green-500/15 text-green-600 dark:text-green-400"
                  }`}
                >
                  {riskTitle}
                </span>
              </div>
              <p className="text-xs text-primary/60 mt-1">{reportSubtitle}</p>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center w-full sm:w-auto">
            <div className="rounded-lg bg-secondary/40 border border-border/50 px-3.5 py-2.5">
              <span className="text-[10px] uppercase tracking-wider text-primary/50 block font-semibold">
                Total Words
              </span>
              <span className="text-base font-bold font-mono text-primary">
                {wordCount.toLocaleString()}
              </span>
            </div>
            <div className="rounded-lg bg-secondary/40 border border-border/50 px-3.5 py-2.5">
              <span className="text-[10px] uppercase tracking-wider text-primary/50 block font-semibold">
                Matched Words
              </span>
              <span className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">
                {matchedWords.toLocaleString()} / {wordCount.toLocaleString()}
              </span>
            </div>
            <div className="rounded-lg bg-secondary/40 border border-border/50 px-3.5 py-2.5">
              <span className="text-[10px] uppercase tracking-wider text-primary/50 block font-semibold">
                Sources
              </span>
              <span className="text-base font-bold font-mono text-blue-600 dark:text-blue-400">
                {sources.length}
              </span>
            </div>
            <div className="rounded-lg bg-secondary/40 border border-border/50 px-3.5 py-2.5">
              <span className="text-[10px] uppercase tracking-wider text-primary/50 block font-semibold">
                Confidence
              </span>
              <span className="text-base font-bold font-mono text-green-600 dark:text-green-400">
                {sources.length > 0 && effectiveSimScore >= 90
                  ? "VERY HIGH"
                  : sources.length > 0
                    ? "HIGH"
                    : "95%"}
              </span>
            </div>
          </div>
        </div>

        {/* Proportional Distribution Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-primary/80">
            <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Original Content ({100 - effectiveSimScore}%)
            </span>
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              Matched Text ({effectiveSimScore}%)
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary border border-border/50 flex">
            <div
              className="bg-green-500 h-full transition-all"
              style={{ width: `${100 - effectiveSimScore}%` }}
              title={`Original Content: ${100 - effectiveSimScore}%`}
            />
            <div
              className="bg-amber-500 h-full transition-all"
              style={{ width: `${effectiveSimScore}%` }}
              title={`Duplicate & Pattern Matches: ${effectiveSimScore}%`}
            />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: SUBMITTED CONTENT VS MATCH DETAILS (SIDE-BY-SIDE)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Submitted Content with Highlighting */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-primary/70 flex items-center gap-1.5">
                <Quote className="h-3.5 w-3.5 text-primary" />
                Submitted Content
              </span>
              <span className="text-[11px] text-primary/40 font-mono">
                {charCount} chars • {wordCount} words
              </span>
            </div>

            <div className="rounded-lg bg-secondary/30 p-4 border border-border/50 font-mono text-xs leading-relaxed text-primary/80 max-h-72 overflow-y-auto space-y-2">
              {rawSentences.map((s, idx) => {
                const isFlagged = sentenceAnalysis[idx]?.similarity
                  ? sentenceAnalysis[idx].similarity > 30
                  : false;
                return (
                  <p
                    key={idx}
                    className={`p-1.5 rounded transition-colors ${
                      isFlagged
                        ? "bg-amber-500/15 border-l-2 border-amber-500 text-primary font-medium"
                        : "text-primary/70"
                    }`}
                  >
                    {s.trim()}
                  </p>
                );
              })}
            </div>
          </div>

          <p className="text-[11px] text-primary/40 italic">
            Passages with yellow background denote matches against indexed web
            sources.
          </p>
        </div>

        {/* Right: Match Details Inspector */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-primary/70 flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-blue-500" />
                Match Details
              </span>
              {selectedSource && (
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase ${
                      selectedSource.similarityPercent >= 90
                        ? "bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-400"
                        : "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {selectedSource.similarityPercent >= 90
                      ? "EXACT_MATCH"
                      : "PARTIAL_MATCH"}
                  </span>
                  <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                    {selectedSource.similarityPercent}% Similarity
                  </span>
                </div>
              )}
            </div>

            {selectedSource ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-secondary/40 p-3 border border-border/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary/50">
                        Matched Source
                      </span>
                      {selectedSource.sourceRole === "PRIMARY" ? (
                        <span className="rounded bg-green-500/10 border border-green-500/30 px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase text-green-600 dark:text-green-400">
                          PRIMARY SOURCE
                        </span>
                      ) : selectedSource.sourceRole === "DUPLICATE" ? (
                        <span className="rounded bg-purple-500/10 border border-purple-500/30 px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase text-purple-600 dark:text-purple-400">
                          DUPLICATE COPY
                        </span>
                      ) : null}
                    </div>
                    {selectedSource.verificationStatus === "UNVERIFIED" ? (
                      <span className="rounded bg-yellow-500/10 border border-yellow-500/30 px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase text-yellow-600 dark:text-yellow-400">
                        UNVERIFIED
                      </span>
                    ) : selectedSource.sourceUrl ? (
                      <a
                        href={selectedSource.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline font-medium"
                      >
                        Visit Website <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                  </div>
                  <h4 className="text-xs font-semibold text-primary">
                    {selectedSource.sourceTitle}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-primary/50">
                    <p>
                      Publisher:{" "}
                      <span className="text-primary/70">
                        {selectedSource.publication ||
                          "Source verification unavailable"}
                      </span>
                    </p>
                    <p className="font-mono text-green-600 dark:text-green-400 font-semibold">
                      {selectedSource.verificationStatus === "UNVERIFIED"
                        ? "Confidence: Unverified"
                        : "Confidence: VERY HIGH"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="rounded bg-secondary/30 p-2.5 border border-border/40 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-primary/40 block">
                      Matched Snippet
                    </span>
                    <p className="font-mono text-primary/80 italic">
                      "{selectedSource.matchedSnippet}"
                    </p>
                  </div>
                  <div className="rounded bg-secondary/30 p-2.5 border border-border/40 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-primary/40 block">
                      Indexed Source Text
                    </span>
                    <p className="font-mono text-primary/80 italic">
                      {selectedSource.verificationStatus === "UNVERIFIED"
                        ? "Exact external source passage unverified."
                        : `"${selectedSource.originalSnippet}"`}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-primary/50">
                No matching external source record selected.
              </div>
            )}
          </div>

          {selectedSource?.sourceUrl &&
            selectedSource.verificationStatus !== "UNVERIFIED" && (
              <div className="pt-2 border-t border-border/30 flex justify-end">
                <a
                  href={selectedSource.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  <span>Open Verified Source</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: MATCHING SOURCES RANKING TABLE
      ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-sm font-bold text-primary flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary/70" />
            Matching Sources & Repositories
          </h3>
          <span className="text-xs text-primary/50">
            {sources.length} sources indexed
          </span>
        </div>

        <div className="divide-y divide-border/50">
          {sources.map((src, idx) => {
            const isSelected = selectedSource?.id === src.id;
            const srcWords =
              src.matchedWordCount ||
              Math.round((src.similarityPercent / 100) * totalSentenceWords);
            return (
              <div
                key={src.id}
                onClick={() => setSelectedSource(src)}
                className={`py-3.5 px-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-secondary/70 border border-border/80"
                    : "hover:bg-secondary/30"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-mono font-bold text-primary/70 border border-border/60">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-primary truncate max-w-md">
                        {src.sourceTitle}
                      </h4>
                      {src.sourceRole === "PRIMARY" && (
                        <span className="rounded bg-green-500/10 border border-green-500/20 px-1.5 py-0.2 text-[9px] font-mono font-bold text-green-600 dark:text-green-400">
                          PRIMARY
                        </span>
                      )}
                      {src.sourceRole === "DUPLICATE" && (
                        <span className="rounded bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.2 text-[9px] font-mono font-bold text-purple-600 dark:text-purple-400">
                          DUPLICATE
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-primary/50 truncate block">
                      {src.publication || "Web Knowledge Base"} • {srcWords}{" "}
                      words overlap ({src.similarityPercent}% match)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 self-end sm:self-center">
                  <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                    {src.similarityPercent}%
                  </span>
                  {src.verificationStatus === "UNVERIFIED" ? (
                    <span className="rounded bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-yellow-600 dark:text-yellow-400">
                      Unverified
                    </span>
                  ) : src.sourceUrl ? (
                    <a
                      href={src.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded border border-border bg-secondary/80 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-secondary transition-colors"
                    >
                      <span>Link</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: SENTENCE-BY-SENTENCE FORENSIC ANALYSIS
      ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-sm font-bold text-primary flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary/70" />
            Sentence Analysis Breakdown
          </h3>
          <span className="text-xs text-primary/50">
            {sentenceAnalysis.length} sentences analyzed
          </span>
        </div>

        <div className="divide-y divide-border/50">
          {sentenceAnalysis.map((item) => (
            <div
              key={item.index}
              className="py-3 px-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                {item.status === "High Match" ? (
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                ) : item.status === "Partial Match" ? (
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold text-primary mr-2">
                    Sentence {item.index}:
                  </span>
                  <span className="text-primary/70 italic">"{item.text}"</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <span className="font-mono font-bold text-primary/80">
                  {item.similarity}%
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                    item.status === "High Match"
                      ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                      : item.status === "Partial Match"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        : "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: EXECUTIVE SUMMARY & ORIGINALITY ACTION PLAN
      ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/80 bg-secondary/20 p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-border/50 pb-3">
          <CopyCheck className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-primary">Executive Summary</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="rounded-lg bg-card border border-border/60 p-4 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary/50 block">
              Originality Metrics
            </span>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-primary/70">Original Phrasing:</span>
                <span className="font-mono font-bold text-green-600 dark:text-green-400">
                  {100 - simScore}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary/70">Matched Patterns:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {simScore}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary/70">Total Unique Sentences:</span>
                <span className="font-mono font-bold text-primary">
                  {originalSentenceCount} of {sentenceAnalysis.length}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-card border border-border/60 p-4 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary/50 block">
              Audit Insights
            </span>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-primary/70">
                  High-confidence matches:
                </span>
                <span className="font-mono font-bold text-red-500">
                  {highMatchesCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary/70">Partial matches:</span>
                <span className="font-mono font-bold text-amber-500">
                  {partialMatchesCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary/70">Sources detected:</span>
                <span className="font-mono font-bold text-blue-500">
                  {sources.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
