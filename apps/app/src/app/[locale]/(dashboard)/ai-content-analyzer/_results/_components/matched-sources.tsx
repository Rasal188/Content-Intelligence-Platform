import { Button } from "@v1/ui/button";
import { ExternalLink, Globe } from "lucide-react";
import type { FC } from "react";
import type { MatchedSource } from "../_types/analysis-source.types";

interface MatchedSourcesProps {
  sources: MatchedSource[];
}

/**
 * Matched web or academic sources component.
 */
export const MatchedSources: FC<MatchedSourcesProps> = ({ sources }) => {
  if (sources.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center text-xs text-primary/50">
        No matching web or academic source citations flagged.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-primary/60">
        Matched Web & Index Sources
      </h3>
      <div className="divide-y divide-border/50 rounded-lg border border-border bg-card">
        {sources.map((src) => (
          <div key={src.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary/40 shrink-0" />
                  <h4 className="truncate text-sm font-medium text-primary">
                    {src.sourceTitle}
                  </h4>
                </div>
                {/* Author and Publication Details */}
                {(src.author || src.publication) && (
                  <div className="flex items-center gap-2 text-[11px] text-primary/50 mt-1 pl-6">
                    {src.author && (
                      <span>
                        Author:{" "}
                        <span className="text-primary/70">{src.author}</span>
                      </span>
                    )}
                    {src.author && src.publication && <span>•</span>}
                    {src.publication && (
                      <span>
                        Publication:{" "}
                        <span className="text-primary/70">
                          {src.publication}
                        </span>
                      </span>
                    )}
                  </div>
                )}
              </div>
              <span className="font-mono text-xs font-bold text-yellow-600 dark:text-yellow-400 shrink-0">
                {src.similarityPercent}% Similarity
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs pl-6">
              <div className="rounded bg-secondary/50 p-2 space-y-1">
                <span className="text-[10px] uppercase text-primary/40 font-mono block">
                  Matched Content
                </span>
                <p className="font-mono text-primary/80">
                  "{src.matchedSnippet}"
                </p>
              </div>
              <div className="rounded bg-secondary/50 p-2 space-y-1">
                <span className="text-[10px] uppercase text-primary/40 font-mono block">
                  Source Reference
                </span>
                <p className="font-mono text-primary/80">
                  "{src.originalSnippet}"
                </p>
              </div>
            </div>

            {/* Action Buttons for Source Integration */}
            <div className="flex justify-end gap-2 pt-2 border-t border-border/30 pl-6">
              {src.sourceUrl ? (
                <a
                  href={src.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/80 px-3 py-1 text-xs font-medium text-primary hover:bg-secondary hover:text-primary transition-colors cursor-pointer"
                >
                  <span>View Source</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-7 px-2.5 text-xs opacity-50 cursor-not-allowed"
                >
                  Internal Record
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
