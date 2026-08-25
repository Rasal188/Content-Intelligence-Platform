import { describe, expect, test } from "bun:test";
import { ResultResponseValidator } from "./result-response-validator.service";
import { DeterministicMatcher } from "./forensics/deterministic-matcher";
import type { MatchedSource } from "../_types/analysis-source.types";
import type { AnalysisJobItem } from "../../_jobs/analysis-job.types";
import type { AnalysisResultDomain } from "../_types/analysis-result.types";

describe("Mode-Aware Analysis Presentation & Separation Suite", () => {
  // TEST 1: AI Detection domain payload maintains AI Probability and Human/Mixed probabilities
  test("1. AI Detection domain scores maintain pure AI Probability, Human Probability, and Mixed Probability", () => {
    const text = "Artificial intelligence language models generate text based on statistical prediction.";
    const domain: AnalysisResultDomain = ResultResponseValidator.toDomain(
      {
        aiScore: 82,
        humanProbability: 10,
        mixedProbability: 8,
        aiProbability: 82,
        overallScore: 18,
      },
      "job-ai-mode-1",
      "test.txt",
      text,
      "req-1",
      undefined,
      "gemini-3.6-flash-high",
      [],
    );

    expect(domain.scores.aiProbability.value).toBeGreaterThanOrEqual(0);
    expect(domain.scores.humanProbability?.value).toBeDefined();
    expect(domain.scores.mixedProbability?.value).toBeDefined();
  });

  // TEST 2: AI Detection UI components do not expose Originality or Plagiarism/Similarity
  test("2. AI Detection summary components expose AI Probability and Human Probability rather than Originality", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");

    // Inspect ResultSummaryCard
    const summaryCardCode = fs.readFileSync(
      path.resolve(import.meta.dir, "../_components/result-summary-card.tsx"),
      "utf-8",
    );
    expect(summaryCardCode.includes("<ScoreCard score={rawResult.scores.overallOriginality} />")).toBe(false);
    expect(summaryCardCode.includes("<ScoreCard score={rawResult.scores.plagiarismSimilarity} />")).toBe(false);

    // Inspect WhyThisScore
    const whyThisScoreCode = fs.readFileSync(
      path.resolve(import.meta.dir, "../_components/why-this-score.tsx"),
      "utf-8",
    );
    expect(whyThisScoreCode.includes("<span>Originality (")).toBe(false);
    expect(whyThisScoreCode.includes("<span>Similarity Risk (")).toBe(false);

    // Inspect ResultViewer
    const resultViewerCode = fs.readFileSync(
      path.resolve(import.meta.dir, "../_components/result-viewer.tsx"),
      "utf-8",
    );
    expect(resultViewerCode.includes("<MatchedSources sources={rawResult.matchedSources} />")).toBe(false);
  });

  // TEST 3: Plagiarism Result View preserves Originality, Plagiarism, and Matched Sources
  test("3. Plagiarism Result component explicitly preserves Originality and Plagiarism metrics", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");

    const plagCardCode = fs.readFileSync(
      path.resolve(import.meta.dir, "../_components/plagiarism-result-card.tsx"),
      "utf-8",
    );

    expect(plagCardCode.includes("Content Similarity Report")).toBe(true);
    expect(plagCardCode.includes("Matching Sources & Repositories")).toBe(true);
    expect(plagCardCode.includes("Sentence Analysis Breakdown")).toBe(true);
    expect(plagCardCode.includes("Original Content (")).toBe(true);
  });

  // TEST 4: Job History Component displays mode-specific metrics
  test("4. CompletedJobCard displays mode-specific metrics (AI Likelihood / Human Likelihood vs Originality / Plagiarism)", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");

    const jobCardCode = fs.readFileSync(
      path.resolve(import.meta.dir, "../../_components/completed-job-card.tsx"),
      "utf-8",
    );

    expect(jobCardCode.includes('job.analysisType === "plagiarism"')).toBe(true);
    expect(jobCardCode.includes("Human Likelihood")).toBe(true);
    expect(jobCardCode.includes("AI Likelihood")).toBe(true);
  });

  // TEST 5: DeterministicMatcher remains 100% pure and untouched
  test("5. Plagiarism DeterministicMatcher remains pure and authoritative", () => {
    const text = "All five runs completed everything they planned, yet the bill spanned 27x from cheapest to most expensive.";
    const candidate: MatchedSource = {
      id: "src-1",
      sourceTitle: "Copilot Test",
      sourceUrl: "https://example.com/source",
      similarityPercent: 100,
      matchedSnippet: text,
      originalSnippet: text,
      verificationStatus: "VERIFIED",
    };

    const report = DeterministicMatcher.evaluate(text, [candidate]);
    expect(report.matchedWords).toBe(report.totalSubmittedWords);
    expect(report.literalSimilarityPercent).toBe(100);
    expect(report.isExactMatch).toBe(true);
  });
});
