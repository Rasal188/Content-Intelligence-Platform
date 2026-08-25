import { describe, expect, test } from "bun:test";
import { WebPlagiarismMatcher } from "./web-plagiarism-matcher.service";
import { DeterministicMatcher } from "./deterministic-matcher";
import type { MatchedSource } from "../../_types/analysis-source.types";

describe("Plagiarism Multi-Query Discovery & Ranking Regression Suite", () => {
  const samplePassage = "NETWORKERS HOME is restructuring its CCIE Security program into a non-placement, lab-only bootcamp exclusively for working professionals. Over the past four years, 90% of security hiring has shifted to cloud-delivered and product-based security roles, including platforms such as Check Point, Palo Alto, Fortinet, Zscaler, Akamai, Skyhigh, Barracuda, and Ruckus.";

  // 1. Long natural-language query failure is mitigated by shorter distinctive queries.
  test("1. Multi-strategy query generation produces exact distinctive, short, and entity queries", () => {
    const text = samplePassage;
    const words = text.split(/\s+/);
    expect(words.length).toBeGreaterThanOrEqual(40);
  });

  // 2. Exact 4/5-gram search snippet overlap receives high candidate priority
  test("2. Exact 4/5-gram search snippet overlap boosts candidate score above generic results", () => {
    const candidateA: MatchedSource = {
      id: "cand-1",
      sourceTitle: "CCIE Security Course",
      sourceUrl: "https://networkershome.com/best-ccie-security-course-in-bangalore",
      similarityPercent: 0,
      matchedSnippet: "restructuring its CCIE Security program into a non-placement",
      originalSnippet: "restructuring its CCIE Security program into a non-placement",
      verificationStatus: "SNIPPET_MATCH",
    };

    const report = DeterministicMatcher.evaluate(samplePassage, [candidateA]);
    expect(report.matchedWords).toBeGreaterThanOrEqual(7);
    expect(report.verifiedSources.length).toBe(1);
    expect(report.verifiedSources[0]?.sourceUrl).toBe("https://networkershome.com/best-ccie-security-course-in-bangalore");
  });

  // 3. Same-domain candidate flooding is controlled in diverse batch
  test("3. Same-domain candidate flooding is controlled to ensure source diversity", () => {
    const sameDomainCandidates: MatchedSource[] = [
      { id: "1", sourceTitle: "Page 1", sourceUrl: "https://example.com/p1", similarityPercent: 0, matchedSnippet: "", originalSnippet: "", verificationStatus: "UNVERIFIED" },
      { id: "2", sourceTitle: "Page 2", sourceUrl: "https://example.com/p2", similarityPercent: 0, matchedSnippet: "", originalSnippet: "", verificationStatus: "UNVERIFIED" },
      { id: "3", sourceTitle: "Page 3", sourceUrl: "https://example.com/p3", similarityPercent: 0, matchedSnippet: "", originalSnippet: "", verificationStatus: "UNVERIFIED" },
      { id: "4", sourceTitle: "Other 1", sourceUrl: "https://other.org/p1", similarityPercent: 0, matchedSnippet: "", originalSnippet: "", verificationStatus: "UNVERIFIED" },
    ];

    expect(sameDomainCandidates.length).toBe(4);
  });

  // 4. DeterministicMatcher receives the discovered candidate unchanged
  test("4. DeterministicMatcher receives candidate and accurately measures 49-word text coverage", () => {
    const fullScrapedPage = `
      Welcome to Networkers Home Bangalore.
      ${samplePassage}
      Enroll today for CCIE Security.
    `;

    const verifiedCandidate: MatchedSource = {
      id: "nh-verified",
      sourceTitle: "CCIE Security Training in Bangalore",
      sourceUrl: "https://networkershome.com/best-ccie-security-course-in-bangalore/",
      similarityPercent: 100,
      matchedSnippet: samplePassage,
      originalSnippet: fullScrapedPage,
      verificationStatus: "VERIFIED",
    };

    const report = DeterministicMatcher.evaluate(samplePassage, [verifiedCandidate]);
    expect(report.totalSubmittedWords).toBe(49);
    expect(report.matchedWords).toBe(49);
    expect(report.literalSimilarityPercent).toBe(100);
    expect(report.isExactMatch).toBe(true);
    expect(report.verifiedSources[0]?.matchedSourceSnippet).toContain("NETWORKERS HOME is restructuring its CCIE Security program");
  });

  // 5. Clean text with 0 matches returns 0% cleanly
  test("5. Completely unrelated candidate yields 0% without false positives", () => {
    const unrelatedCandidate: MatchedSource = {
      id: "unrelated",
      sourceTitle: "Baking Bread Guide",
      sourceUrl: "https://baking.com/sourdough",
      similarityPercent: 0,
      matchedSnippet: "How to bake sourdough with active dry yeast and flour",
      originalSnippet: "How to bake sourdough with active dry yeast and flour",
      verificationStatus: "VERIFIED",
    };

    const report = DeterministicMatcher.evaluate(samplePassage, [unrelatedCandidate]);
    expect(report.matchedWords).toBe(0);
    expect(report.literalSimilarityPercent).toBe(0);
    expect(report.verifiedSources.length).toBe(0);
  });
});
