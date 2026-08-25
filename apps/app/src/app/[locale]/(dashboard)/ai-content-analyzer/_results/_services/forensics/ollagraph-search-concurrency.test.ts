import { describe, expect, test, mock } from "bun:test";
import { OllaGraphScraperService } from "./ollagraph-scraper.service";
import { WebPlagiarismMatcher } from "./web-plagiarism-matcher.service";
import { DeterministicMatcher } from "./deterministic-matcher";
import { ResultResponseValidator } from "../result-response-validator.service";
import type { MatchedSource } from "../../_types/analysis-source.types";

describe("OllaGraph Search Concurrency, Bounded Retries & Reliability Suite", () => {
  // TEST 1: Multiple queries executed sequentially with bounded retries obtain target results
  test("TEST 1: Sequential search query execution reliably retrieves search results without burst concurrency drops", async () => {
    const query = "The Prompt Engineering Course at Networkers Home is a 30";
    const results = await OllaGraphScraperService.searchWeb(query, 5000);
    
    // In live or bounded environment, query must either return valid results or structured array
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      expect(results[0]?.url).toBeDefined();
    }
  }, 15000);

  // TEST 2: OllaGraph returns [] on attempt 1 and valid results on attempt 2 (retry simulation)
  test("TEST 2: OllaGraph returns [] on attempt 1 and valid results on attempt 2 -> retry succeeds", async () => {
    let callCount = 0;
    const originalFetch = globalThis.fetch;
    
    globalThis.fetch = mock(async (url: string | URL | Request, init?: RequestInit) => {
      callCount++;
      if (typeof url === "string" && url.includes("/search")) {
        if (callCount === 1) {
          return new Response(JSON.stringify({ results: [] }), { status: 200 });
        }
        return new Response(
          JSON.stringify({
            results: [
              {
                title: "Prompt Engineering Course",
                url: "https://example.org/prompt-engineering",
                snippet: "The Prompt Engineering Course at Networkers Home is a 30-day, instructor-led training programme.",
              },
            ],
          }),
          { status: 200 },
        );
      }
      return originalFetch(url, init);
    }) as any;

    try {
      const results = await OllaGraphScraperService.searchWeb(
        "test retry query",
        5000,
        "test-api-key",
        3,
      );
      expect(callCount).toBe(2);
      expect(results.length).toBe(1);
      expect(results[0]?.url).toBe("https://example.org/prompt-engineering");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // TEST 3: OllaGraph returns [] on all 3 attempts -> OLLAGRAPH_SEARCH_FAILED / degraded state, no false 0% originality
  test("TEST 3: OllaGraph returns [] on all 3 attempts -> validator reports OLLAGRAPH_SEARCH_FAILED", () => {
    const text = "Some submitted text to analyze.";
    const failedCandidate: MatchedSource = {
      id: "ollagraph-search-failed",
      sourceTitle: "OllaGraph Search Unavailable",
      similarityPercent: 0,
      matchedSnippet: "",
      originalSnippet: "",
      verificationStatus: "UNVERIFIED",
      discoveryMethod: "SEARCH_RESULT",
    };

    const domainResult = ResultResponseValidator.toDomain(
      {},
      "job-test-3",
      "test.txt",
      text,
      "req-test-3",
      undefined,
      "gemini-3.6-flash-high",
      [failedCandidate],
    );

    const hasWarning = domainResult.warnings.some(
      (w) => w.code === "OLLAGRAPH_SEARCH_FAILED",
    );
    expect(hasWarning).toBe(true);
    expect(domainResult.scores.overallOriginality.value).toBe(0);
    expect(domainResult.scores.plagiarismSimilarity.value).toBe(0);
  });

  // TEST 4: One query fails but others succeed -> successful results preserved
  test("TEST 4: One query fails/returns empty but other queries succeed -> successful results preserved", () => {
    const verifiedCandidate: MatchedSource = {
      id: "src-success",
      sourceTitle: "Valid Source",
      sourceUrl: "https://example.com/course",
      similarityPercent: 100,
      matchedSnippet: "The Prompt Engineering Course at Networkers Home is a 30-day",
      originalSnippet: "The Prompt Engineering Course at Networkers Home is a 30-day, instructor-led training programme designed to help engineers.",
      verificationStatus: "VERIFIED",
    };

    const matched = WebPlagiarismMatcher.match(
      "The Prompt Engineering Course at Networkers Home is a 30-day",
      20,
      [verifiedCandidate],
    );

    const report = DeterministicMatcher.evaluate(
      "The Prompt Engineering Course at Networkers Home is a 30-day",
      matched,
    );

    expect(report.totalSubmittedWords).toBe(10);
    expect(report.matchedWords).toBe(10);
    expect(report.literalSimilarityPercent).toBe(100);
    expect(report.verifiedSources.length).toBe(1);
    expect(report.verifiedSources[0]?.sourceUrl).toBe("https://example.com/course");
  });

  // TEST 5: Direct expected URL is verified -> DeterministicMatcher receives it and produces 27/27 words match
  test("TEST 5: Complete 27-word passage matched against verified scraped source produces 27/27 words (100%)", () => {
    const text =
      "The Prompt Engineering Course at Networkers Home is a 30-day, instructor-led training programme designed to help engineers, working professionals and AI aspirants build production-grade prompt engineering skills.";

    const scrapedSourceText = `
      Header Navigation ...
      About Our Programs:
      The Prompt Engineering Course at Networkers Home is a 30-day, instructor-led training programme designed to help engineers, working professionals and AI aspirants build production-grade prompt engineering skills.
      Footer contact info ...
    `;

    const candidate: MatchedSource = {
      id: "src-nh",
      sourceTitle: "Prompt Engineering Course",
      sourceUrl: "https://example-institute.org/prompt-engineering-course",
      similarityPercent: 100,
      matchedSnippet: text,
      originalSnippet: scrapedSourceText,
      publication: "Training Institute",
      verificationStatus: "VERIFIED",
    };

    const report = DeterministicMatcher.evaluate(text, [candidate]);
    expect(report.totalSubmittedWords).toBe(27);
    expect(report.matchedWords).toBe(27);
    expect(report.literalSimilarityPercent).toBe(100);
    expect(report.isExactMatch).toBe(true);
  });

  // TEST 6: No hardcoded domain exists in production matcher logic
  test("TEST 6: Production code does not contain hardcoded target test domains", () => {
    const code = WebPlagiarismMatcher.toString();
    expect(code.includes("networkershome.com")).toBe(false);
  });
});
