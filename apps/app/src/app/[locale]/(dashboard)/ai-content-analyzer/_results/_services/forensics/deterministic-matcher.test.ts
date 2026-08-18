import { describe, expect, it } from "bun:test";
import type { MatchedSource } from "../../_types/analysis-source.types";
import { DeterministicMatcher } from "./deterministic-matcher";
import { WebPlagiarismMatcher } from "./web-plagiarism-matcher.service";

describe("DeterministicMatcher & Neutral Source Discovery Invariant Tests", () => {
  // TEST 1: NASA Moon Landing Quote -> NASA is PRIMARY over Wikipedia
  it("TEST 1: NASA quote -> 12/12 words, 100% EXACT_MATCH, NASA is PRIMARY", async () => {
    const text = "That's one small step for a man, one giant leap for mankind.";
    const dynamicCandidates = await WebPlagiarismMatcher.searchWebSources(text);
    const matched = WebPlagiarismMatcher.match(text, 20, dynamicCandidates);
    const report = DeterministicMatcher.evaluate(text, matched);

    expect(report.matchedWords).toBe(12);
    expect(report.literalSimilarityPercent).toBe(100);
    expect(report.isExactMatch).toBe(true);
    expect(report.matchType).toBe("EXACT_MATCH");

    const primary = report.verifiedSources.find(
      (s) => s.sourceRole === "PRIMARY",
    );
    expect(primary).toBeDefined();
    expect(primary?.similarityPercent).toBe(100);
    expect(primary?.sourceUrl?.includes("nasa.gov")).toBe(true);
  }, 15000);

  // TEST 2: Completely original text -> zero sources, NO Wikipedia injection or fallback
  it("TEST 2: Completely original text -> 0 verified sources, NO Wikipedia injection", async () => {
    const text =
      "The quantum garden beside the blue observatory contains three fictional instruments named Orion, Vega, and Sol.";
    const dynamicCandidates = await WebPlagiarismMatcher.searchWebSources(text);
    const matched = WebPlagiarismMatcher.match(text, 20, dynamicCandidates);
    const report = DeterministicMatcher.evaluate(text, matched);

    expect(report.matchedWords).toBe(0);
    expect(report.literalSimilarityPercent).toBe(0);
    expect(report.verifiedSources.length).toBe(0);
    expect(report.isExactMatch).toBe(false);
    expect(report.matchType).toBe("NO_SIGNIFICANT_MATCH");
  }, 15000);

  // TEST 3: Declaration of Independence -> National Archives is PRIMARY, 24/24 words = 100%
  it("TEST 3: Declaration of Independence -> 24/24 words, National Archives is PRIMARY", async () => {
    const text =
      "We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable Rights";
    const dynamicCandidates = await WebPlagiarismMatcher.searchWebSources(text);
    const matched = WebPlagiarismMatcher.match(text, 20, dynamicCandidates);
    const report = DeterministicMatcher.evaluate(text, matched);

    expect(report.totalSubmittedWords).toBe(24);
    expect(report.matchedWords).toBe(24);
    expect(report.literalSimilarityPercent).toBe(100);
    expect(report.isExactMatch).toBe(true);

    const primary = report.verifiedSources.find(
      (s) => s.sourceRole === "PRIMARY",
    );
    expect(primary).toBeDefined();
    expect(primary?.similarityPercent).toBe(100);
    expect(primary?.sourceUrl?.includes("archives.gov")).toBe(true);
  }, 15000);

  // TEST 4: WHO Definition of Health -> WHO is PRIMARY, 100%
  it("TEST 4: WHO definition -> 100% EXACT_MATCH, WHO is PRIMARY", async () => {
    const text =
      "Health is a state of complete physical, mental and social well-being and not merely the absence of disease or infirmity.";
    const dynamicCandidates = await WebPlagiarismMatcher.searchWebSources(text);
    const matched = WebPlagiarismMatcher.match(text, 20, dynamicCandidates);
    const report = DeterministicMatcher.evaluate(text, matched);

    expect(report.totalSubmittedWords).toBe(20);
    expect(report.matchedWords).toBe(20);
    expect(report.literalSimilarityPercent).toBe(100);
    expect(report.isExactMatch).toBe(true);

    const primary = report.verifiedSources.find(
      (s) => s.sourceRole === "PRIMARY",
    );
    expect(primary).toBeDefined();
    expect(primary?.similarityPercent).toBe(100);
    expect(primary?.sourceUrl?.includes("who.int")).toBe(true);
  }, 15000);

  // TEST 5: Multiple sources containing same verbatim quote -> no double counting
  it("TEST 5: multiple sources containing same verbatim quote -> exact word count, no double counting", () => {
    const text = "That's one small step for a man, one giant leap for mankind.";
    const candidates: MatchedSource[] = [
      {
        id: "s1",
        sourceTitle: "NASA",
        sourceUrl: "https://www.nasa.gov/apollo11",
        similarityPercent: 100,
        matchedSnippet: text,
        originalSnippet: text,
        verificationStatus: "VERIFIED",
      },
      {
        id: "s2",
        sourceTitle: "Wiki 1",
        sourceUrl: "https://en.wikipedia.org/wiki/Neil_Armstrong",
        similarityPercent: 100,
        matchedSnippet: text,
        originalSnippet: text,
        verificationStatus: "VERIFIED",
      },
      {
        id: "s3",
        sourceTitle: "Wiki 2",
        sourceUrl: "https://en.wikipedia.org/wiki/Apollo_11",
        similarityPercent: 100,
        matchedSnippet: text,
        originalSnippet: text,
        verificationStatus: "VERIFIED",
      },
    ];

    const report = DeterministicMatcher.evaluate(text, candidates);
    expect(report.totalSubmittedWords).toBe(12);
    expect(report.matchedWords).toBe(12);
    expect(report.literalSimilarityPercent).toBe(100);
    expect(report.verifiedSources.length).toBe(3);
    expect(report.verifiedSources[0]?.sourceRole).toBe("PRIMARY");
    expect(report.verifiedSources[0]?.sourceUrl).toContain("nasa.gov");
  });

  // TEST 6: Only Wikipedia contains verified passage -> Wikipedia CAN become PRIMARY
  it("TEST 6: when only Wikipedia contains verified passage, it becomes PRIMARY", () => {
    const text =
      "Unique custom content that only exists on a specific Wikipedia documentation entry.";
    const candidate: MatchedSource = {
      id: "wiki-only",
      sourceTitle: "Unique Topic — Wikipedia",
      sourceUrl: "https://en.wikipedia.org/wiki/Unique_Topic",
      similarityPercent: 100,
      matchedSnippet: text,
      originalSnippet: text,
      verificationStatus: "VERIFIED",
    };

    const report = DeterministicMatcher.evaluate(text, [candidate]);
    expect(report.verifiedSources[0]?.sourceRole).toBe("PRIMARY");
    expect(report.verifiedSources[0]?.sourceTitle).toContain("Wikipedia");
  });
});
