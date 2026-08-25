import { describe, expect, test } from "bun:test";
import { DeterministicMatcher } from "./deterministic-matcher";
import type { MatchedSource } from "../../_types/analysis-source.types";

describe("Plagiarism Sentence Integrity & Multi-Source Overlap Suite", () => {
  // A. One sentence with partial match: Verify it is PARTIAL MATCH, not ORIGINAL
  test("A. One sentence with partial match is PARTIAL MATCH", () => {
    const singleSentence = "The quick brown fox jumps over the lazy sleeping dog in the sunny meadow.";
    const matchingPart = "The quick brown fox jumps over the lazy"; // partial 7 words

    const candidate: MatchedSource = {
      id: "src-1",
      sourceTitle: "Fox Source",
      sourceUrl: "https://example.org/fox",
      similarityPercent: 55,
      matchedSnippet: matchingPart,
      originalSnippet: matchingPart,
      verificationStatus: "VERIFIED",
    };

    const report = DeterministicMatcher.evaluate(singleSentence, [candidate]);
    expect(report.totalSubmittedWords).toBe(14);
    expect(report.matchedWords).toBe(8);
    expect(report.literalSimilarityPercent).toBe(57);
    expect(report.matchType).toBe("PARTIAL_MATCH");
    expect(report.isExactMatch).toBe(false);
  });

  // B. One sentence with no match: Verify it is ORIGINAL
  test("B. One sentence with no match is ORIGINAL", () => {
    const novelSentence = "Unique quantum algorithms operate synchronously across non-Euclidean computational topologies.";
    const report = DeterministicMatcher.evaluate(novelSentence, []);
    expect(report.totalSubmittedWords).toBe(9);
    expect(report.matchedWords).toBe(0);
    expect(report.literalSimilarityPercent).toBe(0);
    expect(report.matchType).toBe("NO_SIGNIFICANT_MATCH");
  });

  // C. One sentence with complete match: Verify it is EXACT/HIGH MATCH
  test("C. One sentence with complete match is EXACT_MATCH", () => {
    const exactSentence = "That's one small step for a man, one giant leap for mankind.";
    const candidate: MatchedSource = {
      id: "src-nasa",
      sourceTitle: "NASA Apollo",
      sourceUrl: "https://nasa.gov/apollo11",
      similarityPercent: 100,
      matchedSnippet: exactSentence,
      originalSnippet: `Neil Armstrong said: "${exactSentence}" on the Moon.`,
      verificationStatus: "VERIFIED",
    };

    const report = DeterministicMatcher.evaluate(exactSentence, [candidate]);
    expect(report.totalSubmittedWords).toBe(12);
    expect(report.matchedWords).toBe(12);
    expect(report.literalSimilarityPercent).toBe(100);
    expect(report.isExactMatch).toBe(true);
    expect(report.matchType).toBe("EXACT_MATCH");
  });

  // D. Same 5 submitted words matched by 3 different sources: Verify overall matchedWords = 5, not 15
  test("D. Same 5 submitted words matched by 3 sources -> overall matchedWords = 5 (not 15)", () => {
    const submittedText = "The quick brown fox jumps into the clear river on a warm sunny morning.";
    const fiveWords = "The quick brown fox jumps";

    const candidates: MatchedSource[] = [
      {
        id: "src-a",
        sourceTitle: "Source A",
        sourceUrl: "https://example.org/a",
        similarityPercent: 36,
        matchedSnippet: fiveWords,
        originalSnippet: fiveWords,
        verificationStatus: "VERIFIED",
      },
      {
        id: "src-b",
        sourceTitle: "Source B",
        sourceUrl: "https://example.org/b",
        similarityPercent: 36,
        matchedSnippet: fiveWords,
        originalSnippet: fiveWords,
        verificationStatus: "VERIFIED",
      },
      {
        id: "src-c",
        sourceTitle: "Source C",
        sourceUrl: "https://example.org/c",
        similarityPercent: 36,
        matchedSnippet: fiveWords,
        originalSnippet: fiveWords,
        verificationStatus: "VERIFIED",
      },
    ];

    const report = DeterministicMatcher.evaluate(submittedText, candidates);
    expect(report.totalSubmittedWords).toBe(14);
    // Overall matched words must be exactly 5, NOT 15
    expect(report.matchedWords).toBe(5);
    expect(report.literalSimilarityPercent).toBe(36);
    expect(report.verifiedSources.length).toBe(3);
  });

  // E. Evidence correctness: Verify displayed matched evidence corresponds to the actual deterministic matched word range
  test("E. Matched snippet in verified source accurately isolates the deterministic matching range", () => {
    const fullSubmitted = "Our team implemented a high performance binary heap tree indexing architecture for distributed data nodes.";
    const matchingPhrase = "high performance binary heap tree indexing architecture";

    const candidate: MatchedSource = {
      id: "src-evidence",
      sourceTitle: "Architecture Guide",
      sourceUrl: "https://example.org/arch",
      similarityPercent: 50,
      matchedSnippet: "something else",
      originalSnippet: `In this chapter, we discuss ${matchingPhrase} in modern database systems.`,
      verificationStatus: "VERIFIED",
    };

    const report = DeterministicMatcher.evaluate(fullSubmitted, [candidate]);
    expect(report.verifiedSources[0]?.matchedSnippet).toBe(matchingPhrase);
  });
});
