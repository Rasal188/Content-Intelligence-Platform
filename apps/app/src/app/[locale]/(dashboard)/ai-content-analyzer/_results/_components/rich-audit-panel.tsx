"use client";

import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  Lightbulb,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import type { FC } from "react";
import type { AnalysisResultDomain } from "../_types/analysis-result.types";

interface RichAuditPanelProps {
  rawResult: AnalysisResultDomain;
}

type TabType = "summary" | "linguistics" | "diagnostics";

/**
 * Enterprise Audit details displaying natural-language evaluations from the AI model.
 */
export const RichAuditPanel: FC<RichAuditPanelProps> = ({ rawResult }) => {
  const [activeTab, setActiveTab] = useState<TabType>("summary");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const qualityReport = (rawResult.extensions?.writingStyle?.qualityReport ||
    {}) as Record<string, any>;

  const toggleExpand = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const renderSection = (
    id: string,
    title: string,
    content?: string,
    icon?: React.ComponentType<{ className?: string }>,
  ) => {
    const isExpanded = expandedSection === id;
    const Icon = icon || FileText;
    const displayText =
      content ||
      "No detailed assessment compiled by the AI gateway for this metric.";

    return (
      <div
        key={id}
        className="border border-border/60 rounded-lg bg-secondary/30 p-4 transition-all"
      >
        <button
          type="button"
          onClick={() => toggleExpand(id)}
          className="flex w-full items-center justify-between font-medium text-primary text-sm focus:outline-none cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary/75" />
            <span>{title}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-primary/50" />
          ) : (
            <ChevronDown className="h-4 w-4 text-primary/50" />
          )}
        </button>
        {isExpanded && (
          <p className="mt-3 text-xs leading-relaxed text-primary/70 border-t border-border/40 pt-3">
            {displayText}
          </p>
        )}
      </div>
    );
  };

  const renderBullets = (
    title: string,
    items?: string[],
    icon?: React.ComponentType<{ className?: string }>,
  ) => {
    const Icon = icon || Lightbulb;
    const listItems =
      items && items.length > 0
        ? items
        : ["No entries recorded for this category."];

    return (
      <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-3">
        <div className="flex items-center gap-2 text-primary font-medium text-sm">
          <Icon className="h-4 w-4 text-primary/75" />
          <span>{title}</span>
        </div>
        <ul className="list-disc pl-5 text-xs text-primary/70 space-y-1.5">
          {listItems.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-md font-semibold text-primary">
            Detailed Enterprise Audit
          </h2>
          <p className="text-xs text-primary/50">
            Comprehensive evaluation of content metrics, structure, and quality.
          </p>
        </div>

        {/* Audit Navigation Tabs */}
        <div className="flex rounded-lg border border-border bg-secondary/50 p-1 self-start">
          {(["summary", "linguistics", "diagnostics"] as TabType[]).map(
            (tab) => {
              const labels: Record<TabType, string> = {
                summary: "Executive Summary",
                linguistics: "Linguistic Metrics",
                diagnostics: "Diagnostics",
              };
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    activeTab === tab
                      ? "bg-card text-primary shadow-sm"
                      : "text-primary/60 hover:text-primary"
                  } cursor-pointer`}
                >
                  {labels[tab]}
                </button>
              );
            },
          )}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        {activeTab === "summary" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/10 bg-primary/5 p-4 space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-wider text-primary/60">
                Executive Summary
              </h3>
              <p className="text-xs leading-relaxed text-primary/80">
                {qualityReport.executiveSummary ||
                  "The AI content gateway has not compiled an executive summary for this historical record."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderBullets(
                "Key Strengths",
                qualityReport.strengths,
                ShieldCheck,
              )}
              {renderBullets(
                "Recommended Improvements",
                qualityReport.recommendedImprovements,
                Lightbulb,
              )}
            </div>
          </div>
        )}

        {activeTab === "linguistics" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              {renderSection(
                "writingStyle",
                "Writing Style & Tone",
                qualityReport.writingStyleAnalysis,
                BookOpen,
              )}
              {renderSection(
                "vocabulary",
                "Vocabulary & Terminology Diversity",
                qualityReport.vocabularyAnalysis,
                BookOpen,
              )}
              {renderSection(
                "readability",
                "Readability Evaluation",
                qualityReport.readabilityAssessment,
                BookOpen,
              )}
            </div>
            <div className="space-y-4">
              {renderSection(
                "grammar",
                "Grammar & Spelling Mechanics",
                qualityReport.grammarAssessment,
                BookOpen,
              )}
              {renderSection(
                "structure",
                "Structural & Formatting Flow",
                qualityReport.structureAssessment,
                BookOpen,
              )}
              {renderBullets(
                "Key Weaknesses",
                qualityReport.weaknesses,
                HelpCircle,
              )}
            </div>
          </div>
        )}

        {activeTab === "diagnostics" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              {renderSection(
                "aiReasoning",
                "AI Writing Indicators & Synthetic Clues",
                qualityReport.aiDetectionReasoning,
                TrendingUp,
              )}
              {renderSection(
                "riskExplanation",
                "Risk Level Classification Reasoning",
                qualityReport.riskExplanation,
                HelpCircle,
              )}
            </div>
            <div className="space-y-4">
              {renderSection(
                "originality",
                "Original Expression & Similarity Assessment",
                qualityReport.originalityAssessment,
                ShieldCheck,
              )}
              {renderSection(
                "confidenceExplanation",
                "Evaluation Confidence Justification",
                qualityReport.confidenceExplanation,
                HelpCircle,
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
