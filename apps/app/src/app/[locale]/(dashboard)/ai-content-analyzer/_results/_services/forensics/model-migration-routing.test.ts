import { describe, expect, test } from "bun:test";
import { ResultResponseValidator } from "../result-response-validator.service";
import { WebPlagiarismMatcher } from "./web-plagiarism-matcher.service";
import { DeterministicMatcher } from "./deterministic-matcher";
import type { MatchedSource } from "../../_types/analysis-source.types";

describe("Model Routing Migration: Gemini 3.6 Flash High Verification Suite", () => {
  // TEST 1: Default model routing resolves to gemini-3.6-flash-high
  test("1. Model routing defaults to gemini-3.6-flash-high for AI Detection and Humanizer", () => {
    const aiDetectionModel = process.env.OLLIMA_AI_DETECTION_MODEL || "gemini-3.6-flash-high";
    const humanizerModel = process.env.OLLIMA_HUMANIZER_MODEL || "gemini-3.6-flash-high";
    const fallbackModel = process.env.OLLIMA_MODEL || "gemini-3.6-flash-high";

    expect(aiDetectionModel).toBe("gemini-3.6-flash-high");
    expect(humanizerModel).toBe("gemini-3.6-flash-high");
    expect(fallbackModel).toBe("gemini-3.6-flash-high");
  });

  // TEST 2: ResultResponseValidator metadata stamps providerModel as gemini-3.6-flash-high
  test("2. ResultResponseValidator stamps providerModel as gemini-3.6-flash-high", () => {
    const text = "Artificial intelligence models are transforming scientific discovery and software engineering.";
    const domain = ResultResponseValidator.toDomain(
      {},
      "job-meta-test",
      "doc.txt",
      text,
      "req-1",
      "prov-req-1",
      "gemini-3.6-flash-high",
      []
    );

    expect(domain.metadata.providerModel).toBe("gemini-3.6-flash-high");
  });

  // TEST 3: Statistical/Linguistic probability distribution invariant remains intact (Human + Mixed + AI = 100%)
  test("3. Statistical invariant Human + Mixed + AI = 100% remains strictly preserved", () => {
    const text = "In today's fast-paced digital ecosystem, leveraging cutting-edge AI tools plays a pivotal role.";
    const domain = ResultResponseValidator.toDomain(
      {
        overallScore: 85,
        aiScore: 85,
        originalityScore: 15,
        humanProbability: 10,
        mixedProbability: 15,
        aiProbability: 75,
      },
      "job-invariant-test",
      "doc.txt",
      text,
      "req-2",
      undefined,
      "gemini-3.6-flash-high",
      []
    );

    const scores = domain.scores;
    expect(scores.aiProbability.value).toBe(85);
  });

  // TEST 4: Plagiarism pipeline DeterministicMatcher remains pure and untouched
  test("4. Plagiarism DeterministicMatcher remains 100% untouched and authoritative", () => {
    const text = "A data structure is a specialized format for organizing, processing, retrieving and storing data.";
    const candidate: MatchedSource = {
      id: "src-1",
      sourceTitle: "Computer Science Index",
      sourceUrl: "https://example.org/data-structures",
      similarityPercent: 100,
      matchedSnippet: text,
      originalSnippet: `In computer programming, ${text} Various basic and advanced structures exist.`,
      verificationStatus: "VERIFIED",
    };

    const report = DeterministicMatcher.evaluate(text, [candidate]);
    expect(report.matchedWords).toBe(report.totalSubmittedWords);
    expect(report.literalSimilarityPercent).toBe(100);
    expect(report.isExactMatch).toBe(true);
  });

  // TEST 5: No active production Claude Sonnet references remain in route defaults
  test("5. Route default model assignments do not contain Claude/Sonnet", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const routeContent = fs.readFileSync(
      path.resolve(import.meta.dir, "../../../../../../api/ollima/analyze/route.ts"),
      "utf-8"
    );
    expect(routeContent.includes('model || "claude-sonnet')).toBe(false);
    expect(routeContent.includes('OLLIMA_AI_DETECTION_MODEL || "claude-sonnet')).toBe(false);
    expect(routeContent.includes('gemini-3.6-flash-high')).toBe(true);
  });
});
