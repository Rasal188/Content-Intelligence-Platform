"use client";

import { Check, ShieldAlert, Sparkles, Wand2 } from "lucide-react";
import type { AnalysisType } from "../_types/analysis";

interface AnalysisTypeSelectorProps {
  selected?: AnalysisType | null;
  onSelect: (type: AnalysisType | null) => void;
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
    id: "ai_humanizer",
    title: "AI Humanizer",
    description:
      "Rewrite & humanize content with natural phrasing, variable cadence, and authentic tone.",
    icon: Wand2,
  },
];

/**
 * Selection card options component for picking analysis mode.
 * Supports selecting/deselecting modes with visible checkmark and aria-pressed state.
 */
export function AnalysisTypeSelector({
  selected,
  onSelect,
  disabled = false,
}: AnalysisTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-primary/60">
          Select Analysis Mode
        </h3>
        {selected && (
          <span className="text-xs font-medium text-primary/40">
            Click selected card to deselect
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {ANALYSIS_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => {
                if (disabled) return;
                // Allow toggling/deselecting if clicking the active mode
                onSelect(isSelected ? null : opt.id);
              }}
              disabled={disabled}
              className={`relative flex flex-col items-start rounded-lg border p-4 text-left transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-sm"
                  : "border-border bg-card hover:border-primary/40 hover:bg-secondary/40"
              } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"}`}
            >
              {isSelected && (
                <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
              )}
              <div
                className={`mb-2 flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-primary/10 text-primary"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-medium text-primary">{opt.title}</h4>
              <p className="mt-1 text-xs text-primary/60 pr-4">{opt.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
