"use client";

import { FileSearch, ShieldAlert, Sparkles } from "lucide-react";
import type { AnalysisType } from "../_types/analysis";

interface AnalysisTypeSelectorProps {
  selected: AnalysisType;
  onSelect: (type: AnalysisType) => void;
  disabled?: boolean;
}

const ANALYSIS_OPTIONS: Array<{
  id: AnalysisType;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "ai_detection",
    title: "AI Detection",
    description: "Scan for neural model text patterns and synthetic content.",
    icon: Sparkles,
  },
  {
    id: "plagiarism",
    title: "Plagiarism Search",
    description: "Check content uniqueness against web index & documents.",
    icon: ShieldAlert,
  },
  {
    id: "full_audit",
    title: "Full Content Audit",
    description: "Comprehensive combined AI detection, plagiarism & quality check.",
    icon: FileSearch,
  },
];

/**
 * Selection card options component for picking analysis mode.
 */
export function AnalysisTypeSelector({
  selected,
  onSelect,
  disabled = false,
}: AnalysisTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-primary/60">Select Analysis Mode</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {ANALYSIS_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => !disabled && onSelect(opt.id)}
              disabled={disabled}
              className={`flex flex-col items-start rounded-lg border p-4 text-left transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                  : "border-border bg-card hover:border-primary/40"
              } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div
                className={`mb-2 flex h-8 w-8 items-center justify-center rounded-md ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-primary"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-medium text-primary">{opt.title}</h4>
              <p className="mt-1 text-xs text-primary/60">{opt.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
