import { describe, expect, test } from "bun:test";
import { DeterministicMatcher } from "./deterministic-matcher";
import type { MatchedSource } from "../../_types/analysis-source.types";

describe("DeterministicMatcher Math & Overlap Integrity Suite", () => {
  test("Partial source document does NOT receive 100% similarity when submitted text is longer", () => {
    // 5 sentences total (approx 56 words)
    const sentence1_2 = "In computer science, a data structure is a data organization, management, and storage format that enables efficient access and modification. More precisely, a data structure is a collection of data values and relationships.";
    const sentence3_4_5 = "In our proprietary internal system, we implemented a custom binary heap algorithm. The benchmarks indicated a 40 percent throughput increase across all distributed worker nodes. Our engineering team documented the complete architecture in our internal wiki.";
    const fullSubmittedText = `${sentence1_2} ${sentence3_4_5}`;

    // Source contains ONLY sentence 1 and 2
    const candidates: MatchedSource[] = [
      {
        id: "src-wiki",
        sourceTitle: "Data Structure Definition",
        sourceUrl: "https://example.org/datastructures",
        similarityPercent: 100,
        matchedSnippet: sentence1_2,
        originalSnippet: sentence1_2,
        verificationStatus: "VERIFIED",
      },
    ];

    const report = DeterministicMatcher.evaluate(fullSubmittedText, candidates);

    // Submitted text is longer than the source passage
    // Sentences 1 & 2 are in the source, sentences 3, 4, 5 are NOT
    expect(report.totalSubmittedWords).toBeGreaterThan(50);
    // Matched words must be approx the length of sentences 1 & 2 (approx 30 words), NOT 100% of 56
    expect(report.matchedWords).toBeLessThan(report.totalSubmittedWords);
    expect(report.literalSimilarityPercent).toBeLessThan(75);
    expect(report.literalSimilarityPercent).toBeGreaterThan(45);
    expect(report.isExactMatch).toBe(false);
    expect(report.matchType).toBe("PARTIAL_MATCH");
  });

  test("Exact match is ONLY awarded when source contains entire submitted text", () => {
    const quote = "That's one small step for a man, one giant leap for mankind.";
    const longSourceArticle = `Apollo 11 was the American spaceflight that first landed humans on the Moon. Commander Neil Armstrong stepped onto the lunar surface and famously declared: "${quote}". The mission was a turning point.`;

    const candidates: MatchedSource[] = [
      {
        id: "src-nasa",
        sourceTitle: "NASA Apollo 11",
        sourceUrl: "https://nasa.gov/apollo11",
        similarityPercent: 100,
        matchedSnippet: quote,
        originalSnippet: longSourceArticle,
        verificationStatus: "VERIFIED",
      },
    ];

    const report = DeterministicMatcher.evaluate(quote, candidates);
    expect(report.matchedWords).toBe(report.totalSubmittedWords);
    expect(report.literalSimilarityPercent).toBe(100);
    expect(report.isExactMatch).toBe(true);
    expect(report.matchType).toBe("EXACT_MATCH");
  });
});
