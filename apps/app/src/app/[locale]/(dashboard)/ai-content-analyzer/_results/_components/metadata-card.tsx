import type { FC } from "react";
import type { AnalysisMetadata } from "../_types/analysis-metadata.types";

interface MetadataCardProps {
  metadata: AnalysisMetadata;
}

/**
 * Metadata card displaying engine versions, checksums, and execution metrics.
 */
export const MetadataCard: FC<MetadataCardProps> = ({ metadata }) => {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-primary/60">Report Metadata</h3>
        {metadata.isMockData && (
          <span className="rounded bg-yellow-500/10 px-2 py-0.5 font-mono text-[9px] uppercase font-semibold text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">
            Mock Rule Engine
          </span>
        )}
      </div>

      {metadata.isMockData && (
        <div className="rounded bg-yellow-500/5 border border-yellow-500/10 p-3 text-[11px] text-yellow-600 dark:text-yellow-400/90 leading-relaxed font-mono">
          <span className="font-bold">DISCLAIMER:</span> Development Mode - Mock
          Rule Engine - No AI Model Used - No External Provider. Results
          generated from deterministic local rules for development and
          verification purposes.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs font-mono text-primary/70">
        <div>
          <span className="text-primary/40 block text-[10px] uppercase tracking-wider mb-0.5">
            Model
          </span>
          <span className="text-primary/90 font-semibold">
            {metadata.providerModel || "gemini-3.6-flash-high"}
          </span>
        </div>
        <div>
          <span className="text-primary/40 block text-[10px] uppercase tracking-wider mb-0.5">
            Prompt Version
          </span>
          <span className="text-primary/90 font-semibold">
            {metadata.promptVersion || "v2.4"}
          </span>
        </div>
        <div>
          <span className="text-primary/40 block text-[10px] uppercase tracking-wider mb-0.5">
            Analysis Time
          </span>
          <span className="text-primary/80">
            {metadata.processingTimeSeconds > 0
              ? `${metadata.processingTimeSeconds}s`
              : `${(metadata.executionTimeMs / 1000).toFixed(1)}s`}
          </span>
        </div>
        <div>
          <span className="text-primary/40 block text-[10px] uppercase tracking-wider mb-0.5">
            Engine Name
          </span>
          <span className="text-primary/80">{metadata.providerName}</span>
        </div>
        <div>
          <span className="text-primary/40 block text-[10px] uppercase tracking-wider mb-0.5">
            Engine Version
          </span>
          <span className="text-primary/80">{metadata.engineVersion}</span>
        </div>
        <div>
          <span className="text-primary/40 block text-[10px] uppercase tracking-wider mb-0.5">
            Schema Version
          </span>
          <span className="text-primary/80">{metadata.schemaVersion}</span>
        </div>
        <div>
          <span className="text-primary/40 block text-[10px] uppercase tracking-wider mb-0.5">
            Generated At
          </span>
          <span className="text-primary/80">
            {new Date(metadata.generatedAt).toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-primary/40 block text-[10px] uppercase tracking-wider mb-0.5">
            Checksum
          </span>
          <span
            className="text-primary/80 truncate block max-w-full"
            title={metadata.checksum}
          >
            {metadata.checksum}
          </span>
        </div>
      </div>
    </div>
  );
};
