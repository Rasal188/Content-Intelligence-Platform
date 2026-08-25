import { describe, expect, test } from "bun:test";
import { DeterministicMatcher } from "./deterministic-matcher";
import type { MatchedSource } from "../../_types/analysis-source.types";

describe("Matched Source Evidence Extraction & Context Isolation Suite", () => {
  test("1. Matched submitted excerpt and source-side evidence passage correspond accurately to deterministic matched range", () => {
    // 69 words total submitted text
    const contextStart = "In the domain of modern cloud distributed systems, software engineering teams must carefully design resilient communication protocols.";
    const matchingVerbatimPassage = "a data structure is a data organization, management, and storage format that enables efficient access"; // 13 words
    const contextEnd = "This architectural choice drastically improves caching latency and maximizes cluster computing throughput across all operational workloads.";
    const fullSubmittedText = `${contextStart} ${matchingVerbatimPassage} ${contextEnd}`;

    // Scraped document containing thousands of words of headers, navigation, article body, and footers
    const largeScrapedPage = `
      NAV_HEADER: Home | Docs | API | About Us | Contact
      SIDEBAR: Getting Started, Tutorials, Data Formats, References
      ===============================================================
      CHAPTER 1: INTRODUCTION TO STORAGE FORMATS
      In computer science, ${matchingVerbatimPassage} and modification across memory hierarchies.
      More precisely, an abstract data type defines the operations while data structures implement them.
      ===============================================================
      FOOTER: Copyright 2026 Educational Foundation. All rights reserved. Terms of Service | Privacy Policy.
    `;

    const candidate: MatchedSource = {
      id: "src-doc",
      sourceTitle: "Data Structures & Formats — CS Repository",
      sourceUrl: "https://example.org/cs-docs/data-structures",
      similarityPercent: 19,
      matchedSnippet: "arbitrary snippet",
      originalSnippet: largeScrapedPage,
      verificationStatus: "VERIFIED",
    };

    const report = DeterministicMatcher.evaluate(fullSubmittedText, [candidate]);

    // 1. Total and matched word count verification
    expect(report.matchedWords).toBe(15);
    expect(report.literalSimilarityPercent).toBeGreaterThanOrEqual(18);
    expect(report.literalSimilarityPercent).toBeLessThanOrEqual(40);

    const verified = report.verifiedSources[0];
    expect(verified).toBeDefined();

    // 2. Matched submitted excerpt isolates the exact 13-word matched phrase
    expect(verified?.matchedSnippet).toBe(matchingVerbatimPassage);

    // 3. Source-side evidence isolates the exact matching phrase from the middle of the large page
    expect(verified?.matchedSourceSnippet).toBe(matchingVerbatimPassage);

    // 4. Source context provides before and after context without starting with arbitrary navigation headers
    expect(verified?.matchedSourceContext).toBeDefined();
    expect(verified?.matchedSourceContext?.match).toBe(matchingVerbatimPassage);
    expect(verified?.matchedSourceContext?.before).toContain("In computer science,");
    expect(verified?.matchedSourceContext?.before).not.toContain("NAV_HEADER");
    expect(verified?.matchedSourceContext?.after).toContain("and modification across");

    // 5. Source URL remains the discovered URL
    expect(verified?.sourceUrl).toBe("https://example.org/cs-docs/data-structures");
  });
});
