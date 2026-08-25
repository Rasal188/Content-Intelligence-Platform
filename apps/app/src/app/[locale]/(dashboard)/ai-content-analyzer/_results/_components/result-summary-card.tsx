import type { FC } from "react";
import type { ResultViewModel } from "../_services/result-view-model.service";
import { ConfidenceCard } from "./confidence-card";
import { RiskIndicator } from "./risk-indicator";
import { ScoreCard } from "./score-card";
import { WhyThisScore } from "./why-this-score";

interface ResultSummaryCardProps {
  viewModel: ResultViewModel;
}

/**
 * Result Summary header card containing high-level score grids and risk badge.
 */
export const ResultSummaryCard: FC<ResultSummaryCardProps> = ({
  viewModel,
}) => {
  const { rawResult } = viewModel;

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-primary">
              {viewModel.documentTitle}
            </h2>
            <RiskIndicator level={rawResult.overallRiskLevel} />
          </div>
          <p className="text-xs text-primary/50 mt-1">
            {viewModel.documentMetaText} • {viewModel.readingTimeText}
          </p>
        </div>

        {viewModel.isMockData && (
          <span className="inline-flex items-center rounded-md bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 font-mono text-xs font-medium text-yellow-600 dark:text-yellow-400 shrink-0">
            Development / Mock Result
          </span>
        )}
      </div>

      {/* Unclassifiable / Insufficient Content Banner */}
      {rawResult.metadata.classifiable === false ? (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-5 space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-yellow-500" />
            <h3 className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
              Insufficient text for reliable AI analysis
            </h3>
          </div>
          <p className="text-xs text-yellow-600/90 dark:text-yellow-400/90">
            {rawResult.metadata.unclassifiableReason ||
              "The submitted content does not contain enough linguistic structure to produce a meaningful authorship classification."}
          </p>
        </div>
      ) : (
        <>
          {/* Low confidence advisory notice */}
          {rawResult.metadata.classifiability === "LOW_CONFIDENCE" && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs text-primary/70">
              <span className="font-semibold text-primary">Note:</span> This short text sample was evaluated with baseline probabilistic confidence.
            </div>
          )}

          {/* Chance breakdown chips */}
          {rawResult.scores.humanProbability &&
            rawResult.scores.mixedProbability && (
              <div className="rounded-lg border border-border/80 bg-secondary/20 p-4 space-y-3">
                <span className="text-xs font-semibold text-primary/70 uppercase tracking-wider block">
                  Chance this text is...
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center justify-between rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2.5">
                    <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                      Human
                    </span>
                    <span className="font-mono text-base font-bold text-green-600 dark:text-green-400">
                      {rawResult.scores.humanProbability.value}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2.5">
                    <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">
                      Mixed
                    </span>
                    <span className="font-mono text-base font-bold text-yellow-600 dark:text-yellow-400">
                      {rawResult.scores.mixedProbability.value}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5">
                    <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                      AI
                    </span>
                    <span className="font-mono text-base font-bold text-red-600 dark:text-red-400">
                      {Math.max(
                        0,
                        100 -
                          (rawResult.scores.humanProbability.value +
                            rawResult.scores.mixedProbability.value),
                      )}
                      %
                    </span>
                  </div>
                </div>
              </div>
            )}

          {/* Score Cards Grid: AI Probability, Human Probability, Mixed Probability, Readability */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ScoreCard score={rawResult.scores.aiProbability} />
            {rawResult.scores.humanProbability ? (
              <ScoreCard score={rawResult.scores.humanProbability} />
            ) : (
              <ScoreCard
                score={{
                  id: "score-human",
                  name: "Human Probability",
                  value: Math.max(0, 100 - rawResult.scores.aiProbability.value),
                  confidence: rawResult.scores.aiProbability.confidence,
                  weight: 1,
                  description: "Estimated probability of organic human authorship.",
                }}
              />
            )}
            {rawResult.scores.mixedProbability ? (
              <ScoreCard score={rawResult.scores.mixedProbability} />
            ) : (
              <ScoreCard
                score={{
                  id: "score-mixed",
                  name: "Mixed Probability",
                  value: 0,
                  confidence: rawResult.scores.aiProbability.confidence,
                  weight: 1,
                  description: "Estimated likelihood of hybrid AI-human co-authorship.",
                }}
              />
            )}
            <ScoreCard score={rawResult.scores.readabilityQuality} />
          </div>

          <WhyThisScore rawResult={rawResult} />

          <ConfidenceCard
            confidencePercent={rawResult.scores.aiProbability.confidence}
          />
        </>
      )}
    </div>
  );
};
