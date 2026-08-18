import type { FC } from "react";
import type { AnalysisStatistics } from "../_types/analysis-statistics.types";

interface StatisticsCardProps {
  statistics: AnalysisStatistics;
}

/**
 * Statistics metrics card component.
 */
export const StatisticsCard: FC<StatisticsCardProps> = ({ statistics }) => {
  const showSentences = statistics.sentences !== undefined;
  const showReadability = statistics.readabilityScore !== undefined;

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4 font-sans">
      <h3 className="text-sm font-medium text-primary/60">
        Content Statistics
      </h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 text-xs">
        <div>
          <span className="text-primary/40 block">Characters</span>
          <span className="font-mono text-base font-semibold text-primary">
            {statistics.characters}
          </span>
        </div>
        <div>
          <span className="text-primary/40 block">Words</span>
          <span className="font-mono text-base font-semibold text-primary">
            {statistics.words}
          </span>
        </div>
        <div>
          <span className="text-primary/40 block">Paragraphs</span>
          <span className="font-mono text-base font-semibold text-primary">
            {statistics.paragraphs}
          </span>
        </div>
        {showSentences && (
          <div>
            <span className="text-primary/40 block">Sentences</span>
            <span className="font-mono text-base font-semibold text-primary">
              {statistics.sentences}
            </span>
          </div>
        )}
        <div>
          <span className="text-primary/40 block">Est. Reading Time</span>
          <span className="font-mono text-base font-semibold text-primary">
            {statistics.estimatedReadingTimeMinutes} min
          </span>
        </div>
        <div>
          <span className="text-primary/40 block">Vocab Diversity</span>
          <span className="font-mono text-base font-semibold text-primary">
            {statistics.words === 0
              ? "--"
              : `${statistics.vocabularyDiversityPercent}%`}
          </span>
        </div>
        <div>
          <span className="text-primary/40 block">Avg Sentence Length</span>
          <span className="font-mono text-base font-semibold text-primary">
            {statistics.words === 0
              ? "--"
              : `${statistics.averageSentenceLengthWords} words`}
          </span>
        </div>
        {showReadability && (
          <div>
            <span className="text-primary/40 block">Readability Score</span>
            <span className="font-mono text-base font-semibold text-primary">
              {statistics.readabilityScore === -1
                ? "--"
                : statistics.readabilityScore}
            </span>
          </div>
        )}
        <div>
          <span className="text-primary/40 block">Language</span>
          <span className="font-mono text-base font-semibold text-primary">
            {statistics.language}
          </span>
        </div>
      </div>
    </div>
  );
};
