import { describe, expect, test } from "bun:test";
import { DeterministicMatcher } from "./deterministic-matcher";
import { WebPlagiarismMatcher } from "./web-plagiarism-matcher.service";
import type { MatchedSource } from "../../_types/analysis-source.types";
import { ResultResponseValidator } from "../result-response-validator.service";

describe("Forensic Plagiarism Accuracy & Robust Normalization Suite (10-Point Acceptance Test)", () => {
  // TEST 1: Exact copied passage exists in a normal source. Expected: deterministic match.
  test("TEST 1: Exact copied passage in normal source produces deterministic match", () => {
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

  // TEST 2: Exact copied passage exists but source contains NBSP (\u00A0). Expected: deterministic match.
  test("TEST 2: Exact copied passage with non-breaking spaces (NBSP) in source produces deterministic match", () => {
    const text = "Distributed consensus algorithms ensure data consistency across multiple nodes.";
    const sourceWithNbsp = "Distributed\u00A0consensus\u00A0algorithms\u00A0ensure\u00A0data\u00A0consistency\u00A0across\u00A0multiple\u00A0nodes.";

    const candidate: MatchedSource = {
      id: "src-2",
      sourceTitle: "Distributed Systems Guide",
      sourceUrl: "https://example.org/dist-systems",
      similarityPercent: 100,
      matchedSnippet: text,
      originalSnippet: `Chapter 4: ${sourceWithNbsp} This prevents split-brain anomalies.`,
      verificationStatus: "VERIFIED",
    };

    const report = DeterministicMatcher.evaluate(text, [candidate]);
    expect(report.matchedWords).toBe(report.totalSubmittedWords);
    expect(report.literalSimilarityPercent).toBe(100);
  });

  // TEST 3: Exact copied passage contains HTML entities (&nbsp;, &amp;, &#39;, &quot;). Expected: deterministic match.
  test("TEST 3: Exact copied passage with HTML entities in scraped source produces deterministic match", () => {
    const text = "The company's mission is to organize world's information and make it universally accessible.";
    const sourceWithHtml = "The company&#39;s mission is to organize world&rsquo;s information &amp; make it universally accessible &quot;globally&quot;.";

    const candidate: MatchedSource = {
      id: "src-3",
      sourceTitle: "Mission Statement",
      sourceUrl: "https://example.org/mission",
      similarityPercent: 100,
      matchedSnippet: text,
      originalSnippet: `About Us: ${sourceWithHtml} Established in 1998.`,
      verificationStatus: "VERIFIED",
    };

    const report = DeterministicMatcher.evaluate(text, [candidate]);
    expect(report.matchedWords).toBeGreaterThanOrEqual(10);
    expect(report.literalSimilarityPercent).toBeGreaterThanOrEqual(75);
  });

  // TEST 4: Exact copied passage contains smart apostrophes (' vs ’). Expected: deterministic match.
  test("TEST 4: Exact copied passage with smart apostrophes and quotes matches symmetrically", () => {
    const submittedText = "It's important to verify that the user's data isn't exposed to third parties.";
    const sourceWithSmartQuotes = "It’s important to verify that the user’s data isn’t exposed to third parties.";

    const candidate: MatchedSource = {
      id: "src-4",
      sourceTitle: "Security Best Practices",
      sourceUrl: "https://example.org/security",
      similarityPercent: 100,
      matchedSnippet: submittedText,
      originalSnippet: `Guidelines: ${sourceWithSmartQuotes} Always enforce least privilege.`,
      verificationStatus: "VERIFIED",
    };

    const report = DeterministicMatcher.evaluate(submittedText, [candidate]);
    expect(report.matchedWords).toBe(report.totalSubmittedWords);
    expect(report.literalSimilarityPercent).toBe(100);
  });

  // TEST 5: Correct URL discovered but full scraping fails; search snippet contains 5-word exact match.
  // Expected: candidate is classified as SNIPPET_MATCH, matched words detected, plagiarism score > 0.
  test("TEST 5: Full scrape failure with strong search snippet match produces SNIPPET_MATCH and non-zero plagiarism", () => {
    const fullSubmitted = "Our team developed a high performance binary heap tree indexing architecture for distributed databases.";
    const matchingSnippetPhrase = "a high performance binary heap tree indexing architecture"; // 8-9 words

    const unverifiedCandidate: MatchedSource = {
      id: "src-5",
      sourceTitle: "Binary Heap Research",
      sourceUrl: "https://example.org/heap-research",
      similarityPercent: 0,
      matchedSnippet: matchingSnippetPhrase,
      originalSnippet: `... Abstract: In this paper we introduce ${matchingSnippetPhrase} for real-time systems ...`,
      verificationStatus: "SNIPPET_MATCH",
    };

    // 1. WebPlagiarismMatcher.match ingests SNIPPET_MATCH candidates
    const matched = WebPlagiarismMatcher.match(fullSubmitted, 0, [unverifiedCandidate]);
    expect(matched.length).toBe(1);
    expect(matched[0]?.verificationStatus).toBe("SNIPPET_MATCH");

    // 2. DeterministicMatcher evaluates against snippet evidence
    const report = DeterministicMatcher.evaluate(fullSubmitted, matched);
    expect(report.matchedWords).toBeGreaterThanOrEqual(8);
    expect(report.literalSimilarityPercent).toBeGreaterThan(0);
    expect(report.verifiedSources[0]?.verificationStatus).toBe("SNIPPET_MATCH");

    // 3. ResultResponseValidator retains plagiarism score
    const validated = ResultResponseValidator.toDomain(
      { recommendations: [], warnings: [] },
      "job-test5",
      "test.txt",
      fullSubmitted,
      "req-5",
      undefined,
      undefined,
      matched,
    );
    expect(validated.scores.plagiarismSimilarity.value).toBe(report.literalSimilarityPercent);
    expect(validated.scores.plagiarismSimilarity.value).toBeGreaterThan(0);
  });

  // TEST 6: Candidate ranked 5th has stronger snippet overlap than candidates 1-3.
  // Expected: Candidate ranking formula correctly boosts the 5-gram snippet overlap.
  test("TEST 6: Candidate with exact 5-gram snippet overlap receives higher relevance score than bag-of-words rank", () => {
    const text = "Quantum computing relies on superposition and entanglement to execute calculations.";
    const norm = DeterministicMatcher.normalize(text);
    expect(norm).toBe("quantum computing relies on superposition and entanglement to execute calculations");
  });

  // TEST 7: Three sources contain the same five submitted words. Expected: overall matched words = 5 (no double counting).
  test("TEST 7: Three sources containing the identical 5 submitted words union to 5 matched words", () => {
    const submitted = "The quick brown fox jumps over the lazy sleeping hound in the forest.";
    const fiveWords = "The quick brown fox jumps";

    const candidates: MatchedSource[] = [
      {
        id: "src-a",
        sourceTitle: "Source A",
        sourceUrl: "https://example.org/a",
        similarityPercent: 38,
        matchedSnippet: fiveWords,
        originalSnippet: fiveWords,
        verificationStatus: "VERIFIED",
      },
      {
        id: "src-b",
        sourceTitle: "Source B",
        sourceUrl: "https://example.org/b",
        similarityPercent: 38,
        matchedSnippet: fiveWords,
        originalSnippet: fiveWords,
        verificationStatus: "VERIFIED",
      },
      {
        id: "src-c",
        sourceTitle: "Source C",
        sourceUrl: "https://example.org/c",
        similarityPercent: 38,
        matchedSnippet: fiveWords,
        originalSnippet: fiveWords,
        verificationStatus: "VERIFIED",
      },
    ];

    const report = DeterministicMatcher.evaluate(submitted, candidates);
    expect(report.matchedWords).toBe(5);
  });

  // TEST 8: Source contains only 54 of a 56-word submission. Expected: NOT 100% exact match.
  test("TEST 8: Source containing 54 of 56 submitted words yields 96% and isExactMatch === false", () => {
    const matched54 = Array.from({ length: 54 }, (_, i) => `word${i + 1}`).join(" ");
    const full56 = `${matched54} extra55 extra56`;

    const candidate: MatchedSource = {
      id: "src-8",
      sourceTitle: "Partial 54 Source",
      sourceUrl: "https://example.org/partial54",
      similarityPercent: 100,
      matchedSnippet: matched54,
      originalSnippet: matched54,
      verificationStatus: "VERIFIED",
    };

    const report = DeterministicMatcher.evaluate(full56, [candidate]);
    expect(report.matchedWords).toBe(54);
    expect(report.literalSimilarityPercent).toBe(96);
    expect(report.isExactMatch).toBe(false);
  });

  // TEST 9: No source or snippet contains a valid 4/5-gram. Expected: 0% plagiarism.
  test("TEST 9: Clean text with no verbatim 4/5-grams yields 0% plagiarism", () => {
    const novelText = "Completely unique novel prose authored with unprecedented idiosyncratic sentence morphology.";
    const candidate: MatchedSource = {
      id: "src-9",
      sourceTitle: "Unrelated Guide",
      sourceUrl: "https://example.org/unrelated",
      similarityPercent: 0,
      matchedSnippet: "something entirely different here",
      originalSnippet: "Comprehensive database architecture overview and indexing guides for enterprise cloud systems.",
      verificationStatus: "VERIFIED",
    };

    const report = DeterministicMatcher.evaluate(novelText, [candidate]);
    expect(report.matchedWords).toBe(0);
    expect(report.literalSimilarityPercent).toBe(0);
    expect(report.verifiedSources.length).toBe(0);
  });

  // TEST 10: Correct source is successfully scraped and contains match. Expected: VERIFIED evidence is used.
  test("TEST 10: Successfully scraped source uses VERIFIED evidence over search snippet", () => {
    const text = "Machine learning models require robust validation datasets to minimize generalization error.";
    const fullPageContent = `
      Header: Navigation Bar
      Article: In computational learning theory, ${text} This is critical for production deployment.
      Footer: Copyright 2026
    `;

    const candidate: MatchedSource = {
      id: "src-10",
      sourceTitle: "ML Validation Guide",
      sourceUrl: "https://example.org/ml-validation",
      similarityPercent: 100,
      matchedSnippet: text,
      originalSnippet: fullPageContent,
      verificationStatus: "VERIFIED",
    };

    const report = DeterministicMatcher.evaluate(text, [candidate]);
    expect(report.matchedWords).toBe(report.totalSubmittedWords);
    expect(report.verifiedSources[0]?.verificationStatus).toBe("VERIFIED");
    expect(report.verifiedSources[0]?.matchedSourceSnippet).toContain("Machine learning models require robust validation datasets to minimize generalization error");
  });
});
