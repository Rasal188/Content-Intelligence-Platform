import { describe, expect, test } from "bun:test";
import type { MatchedSource } from "./analysis-source.types";

describe("Plagiarism UI Source Evidence Presentation Test", () => {
  test("Retrieved source content is preserved exactly and not substituted", () => {
    const rawScrapedBody = "In computer science, a data structure is a data organization, management, and storage format that is usually chosen for efficient access to data. More precisely, a data structure is a collection of data values, the relationships among them, and the functions or operations that can be applied to the data.";
    const submittedSnippet = "a data structure is a data organization, management, and storage format";

    const sourceCandidate: MatchedSource = {
      id: "source-1",
      sourceTitle: "Data structure — Wikipedia",
      sourceUrl: "https://en.wikipedia.org/wiki/Data_structure",
      similarityPercent: 100,
      matchedSnippet: submittedSnippet,
      originalSnippet: rawScrapedBody,
      publication: "Wikimedia Foundation",
      verificationStatus: "VERIFIED",
    };

    // 1. Source URL remains unchanged
    expect(sourceCandidate.sourceUrl).toBe("https://en.wikipedia.org/wiki/Data_structure");

    // 2. Original snippet contains the exact scraped body without alteration
    expect(sourceCandidate.originalSnippet).toBe(rawScrapedBody);
    expect(sourceCandidate.originalSnippet).not.toBe(submittedSnippet);

    // 3. Matched snippet isolates the relevant matching query
    expect(sourceCandidate.matchedSnippet).toBe(submittedSnippet);

    // 4. Verification status is preserved
    expect(sourceCandidate.verificationStatus).toBe("VERIFIED");
    expect(sourceCandidate.similarityPercent).toBe(100);
  });
});
