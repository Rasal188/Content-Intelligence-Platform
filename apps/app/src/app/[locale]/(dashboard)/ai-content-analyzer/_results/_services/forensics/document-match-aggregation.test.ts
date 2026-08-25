import { describe, expect, test } from "bun:test";
import { DeterministicMatcher } from "./deterministic-matcher";
import type { MatchedSource } from "../../_types/analysis-source.types";
import { ResultResponseValidator } from "../result-response-validator.service";

describe("Plagiarism Document-Level Match Aggregation Canonical Suite", () => {
  // TEST A: 56 submitted words, 56 verified matched positions -> 56/56, 100%
  test("TEST A: 56 submitted words, 56 verified matched positions -> 56/56, 100% Similarity, 0% Originality", () => {
    // Construct 56 word text
    const words = Array.from({ length: 56 }, (_, i) => `word${i + 1}`);
    const text = words.join(" ");
    const sourceText = `Leading context before ${text} trailing context after`;

    const candidates: MatchedSource[] = [
      {
        id: "src-1",
        sourceTitle: "Complete Source",
        sourceUrl: "https://example.org/doc",
        similarityPercent: 100,
        matchedSnippet: text,
        originalSnippet: sourceText,
        verificationStatus: "VERIFIED",
      },
    ];

    const report = DeterministicMatcher.evaluate(text, candidates);
    expect(report.totalSubmittedWords).toBe(56);
    expect(report.matchedWords).toBe(56);
    expect(report.literalSimilarityPercent).toBe(100);
    expect(report.isExactMatch).toBe(true);

    const validated = ResultResponseValidator.toDomain(
      { recommendations: [], warnings: [] },
      "job-1",
      "test.txt",
      text,
      "req-1",
      undefined,
      undefined,
      candidates,
    );
    expect(validated.scores.plagiarismSimilarity.value).toBe(100);
    expect(validated.scores.overallOriginality.value).toBe(0);
  });

  // TEST B: 56 submitted words, 54 verified matched positions -> 54/56, 96%
  test("TEST B: 56 submitted words, 54 verified matched positions -> 54/56, 96% Similarity, 4% Originality", () => {
    const matchedPart = Array.from({ length: 54 }, (_, i) => `word${i + 1}`).join(" ");
    const text = `${matchedPart} unique55 unique56`; // 56 words total

    const candidates: MatchedSource[] = [
      {
        id: "src-2",
        sourceTitle: "Partial Source",
        sourceUrl: "https://example.org/partial",
        similarityPercent: 100,
        matchedSnippet: matchedPart,
        originalSnippet: matchedPart,
        verificationStatus: "VERIFIED",
      },
    ];

    const report = DeterministicMatcher.evaluate(text, candidates);
    expect(report.totalSubmittedWords).toBe(56);
    expect(report.matchedWords).toBe(54);
    expect(report.literalSimilarityPercent).toBe(96);
    expect(report.isExactMatch).toBe(false);

    const validated = ResultResponseValidator.toDomain(
      { recommendations: [], warnings: [] },
      "job-2",
      "test2.txt",
      text,
      "req-2",
      undefined,
      undefined,
      candidates,
    );
    expect(validated.scores.plagiarismSimilarity.value).toBe(96);
    expect(validated.scores.overallOriginality.value).toBe(4);
  });

  // TEST C: 56 submitted words, 30 verified matched positions -> 30/56, 54%
  test("TEST C: 56 submitted words, 30 verified matched positions -> 30/56, 54% Similarity", () => {
    const matchedPart = Array.from({ length: 30 }, (_, i) => `term${i + 1}`).join(" ");
    const remainingPart = Array.from({ length: 26 }, (_, i) => `other${i + 1}`).join(" ");
    const text = `${matchedPart} ${remainingPart}`;

    const candidates: MatchedSource[] = [
      {
        id: "src-3",
        sourceTitle: "Half Source",
        sourceUrl: "https://example.org/half",
        similarityPercent: 100,
        matchedSnippet: matchedPart,
        originalSnippet: matchedPart,
        verificationStatus: "VERIFIED",
      },
    ];

    const report = DeterministicMatcher.evaluate(text, candidates);
    expect(report.totalSubmittedWords).toBe(56);
    expect(report.matchedWords).toBe(30);
    expect(report.literalSimilarityPercent).toBe(54);
  });

  // TEST D: 56 submitted words, 0 verified matched positions -> 0/56, 0%
  test("TEST D: 56 submitted words, 0 verified matched positions -> 0/56, 0% Similarity", () => {
    const text = Array.from({ length: 56 }, (_, i) => `novelword${i + 1}`).join(" ");
    const report = DeterministicMatcher.evaluate(text, []);
    expect(report.totalSubmittedWords).toBe(56);
    expect(report.matchedWords).toBe(0);
    expect(report.literalSimilarityPercent).toBe(0);
  });

  // TEST E: Two sources with overlapping matched positions -> unique union only, no double counting
  test("TEST E: Two sources with overlapping matched positions -> unioned without double counting", () => {
    // Source A matches [0..20] (21 words)
    // Source B matches [20..35] (16 words, word 20 is shared)
    const allWords = Array.from({ length: 50 }, (_, i) => `token${i + 1}`);
    const text = allWords.join(" ");

    const partA = allWords.slice(0, 21).join(" ");
    const partB = allWords.slice(20, 36).join(" ");

    const candidates: MatchedSource[] = [
      {
        id: "src-a",
        sourceTitle: "Source A",
        sourceUrl: "https://example.org/a",
        similarityPercent: 100,
        matchedSnippet: partA,
        originalSnippet: partA,
        verificationStatus: "VERIFIED",
      },
      {
        id: "src-b",
        sourceTitle: "Source B",
        sourceUrl: "https://example.org/b",
        similarityPercent: 100,
        matchedSnippet: partB,
        originalSnippet: partB,
        verificationStatus: "VERIFIED",
      },
    ];

    const report = DeterministicMatcher.evaluate(text, candidates);
    expect(report.totalSubmittedWords).toBe(50);
    // Unique indices from 0 to 35 = 36 words
    expect(report.matchedWords).toBe(36);
    expect(report.literalSimilarityPercent).toBe(72);
  });

  // TEST F: Shorter source contained inside submitted document -> MUST NOT produce 100%
  test("TEST F: Shorter source contained inside submitted document does NOT produce 100% similarity", () => {
    const sourcePassage = "The quick brown fox jumps over the lazy dog in the meadow.";
    const longSubmitted = `${sourcePassage} Furthermore, we developed several other distinct algorithmic modules to handle background data synchronization across all enterprise client databases.`;

    const candidates: MatchedSource[] = [
      {
        id: "src-short",
        sourceTitle: "Short Source",
        sourceUrl: "https://example.org/short",
        similarityPercent: 100,
        matchedSnippet: sourcePassage,
        originalSnippet: sourcePassage,
        verificationStatus: "VERIFIED",
      },
    ];

    const report = DeterministicMatcher.evaluate(longSubmitted, candidates);
    expect(report.literalSimilarityPercent).toBeLessThan(60);
    expect(report.isExactMatch).toBe(false);
  });

  // TEST G: Source contains entire submitted document -> 100% exact match is valid
  test("TEST G: Source contains entire submitted document -> 100% exact match", () => {
    const submitted = "The quick brown fox jumps over the lazy dog.";
    const fullArticle = `Introduction to testing: ${submitted} This concludes the paragraph.`;

    const candidates: MatchedSource[] = [
      {
        id: "src-full",
        sourceTitle: "Full Container",
        sourceUrl: "https://example.org/full",
        similarityPercent: 100,
        matchedSnippet: submitted,
        originalSnippet: fullArticle,
        verificationStatus: "VERIFIED",
      },
    ];

    const report = DeterministicMatcher.evaluate(submitted, candidates);
    expect(report.matchedWords).toBe(report.totalSubmittedWords);
    expect(report.literalSimilarityPercent).toBe(100);
    expect(report.isExactMatch).toBe(true);
  });
});
