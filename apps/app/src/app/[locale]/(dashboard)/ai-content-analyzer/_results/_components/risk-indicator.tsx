import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import type { FC } from "react";
import type { HighlightRiskLevel } from "../_types/analysis-highlight.types";

interface RiskIndicatorProps {
  level: HighlightRiskLevel;
  className?: string;
  showSubtitle?: boolean;
}

const RISK_CONFIG: Record<
  HighlightRiskLevel,
  {
    label: string;
    style: string;
    icon: React.ComponentType<{ className?: string }>;
    detail: string;
  }
> = {
  low: {
    label: "Overall Risk: Low",
    style:
      "bg-green-500/10 text-green-600 ring-green-600/20 dark:text-green-400",
    icon: CheckCircle2,
    detail:
      "Natural human writing characteristics with minimal synthetic markers.",
  },
  medium: {
    label: "Overall Risk: Moderate",
    style:
      "bg-yellow-500/10 text-yellow-600 ring-yellow-600/20 dark:text-yellow-400",
    icon: AlertTriangle,
    detail: "Mixed linguistic patterns or repetitive structures detected.",
  },
  high: {
    label: "Overall Risk: High",
    style:
      "bg-orange-500/10 text-orange-600 ring-orange-600/20 dark:text-orange-400",
    icon: ShieldAlert,
    detail: "Elevated probability of AI generation and template structure.",
  },
  critical: {
    label: "Overall Risk: Critical",
    style: "bg-red-500/10 text-red-600 ring-red-600/20 dark:text-red-400",
    icon: XCircle,
    detail:
      "Heavy synthetic patterns, uniform predictability, and repetitive syntax.",
  },
};

/**
 * Risk level indicator badge component.
 */
export const RiskIndicator: FC<RiskIndicatorProps> = ({
  level,
  className = "",
  showSubtitle = false,
}) => {
  const config = RISK_CONFIG[level] || RISK_CONFIG.low;
  const Icon = config.icon;

  return (
    <div className="inline-flex flex-col">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${config.style} ${className}`}
        title={
          "Based on combined AI writing indicators, sentence burstiness, and structural predictability."
        }
      >
        <Icon className="h-3.5 w-3.5" />
        <span>{config.label}</span>
      </span>
      {showSubtitle && (
        <span className="text-[10px] text-primary/40 mt-1">
          Based on combined AI writing indicators, sentence burstiness, and
          structural predictability.
        </span>
      )}
    </div>
  );
};
