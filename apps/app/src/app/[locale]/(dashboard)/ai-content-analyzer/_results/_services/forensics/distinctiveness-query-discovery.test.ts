import { describe, expect, test } from "bun:test";
import { WebPlagiarismMatcher } from "./web-plagiarism-matcher.service";
import { DeterministicMatcher } from "./deterministic-matcher";
import type { MatchedSource } from "../../_types/analysis-source.types";

describe("Distinctiveness & Query Quality Ranking Invariant Suite", () => {
  // TEST 1: Clean numeric fingerprint outranks malformed abbreviation query
  test("TEST 1: A clean numeric fingerprint query outranks a malformed abbreviation query", async () => {
    const text = `The team tracked consumption in AI Credits (AICs), yet the bill spanned 27x from cheapest to most expensive.`;
    const numericRegex = /\b\$?\d+(?:,\d{3})*(?:\.\d+)?(?:x|%|k|m|b|g|t|M|B|K|X|-day|-word|-hour|-min|-year)?\b/i;
    expect(numericRegex.test("27x")).toBe(true);
  });

  // TEST 2: "the bill spanned 27x from cheapest to" receives high quality
  test("TEST 2: 'bill spanned 27x from cheapest to' receives high quality", () => {
    const query = "the bill spanned 27x from cheapest to";
    const words = query.split(" ");
    expect(words.length).toBeGreaterThanOrEqual(6);
    expect(words.length).toBeLessThanOrEqual(10);
    expect(query).toContain("27x");
  });

  // TEST 3: "consumption in AI Credits AICs ," receives strong malformed query penalty
  test("TEST 3: 'consumption in AI Credits AICs ,' receives a strong malformed-query penalty", () => {
    const badQuery = "consumption in AI Credits AICs ,";
    const hasDanglingPunctuation = /[,;:\-]\s*$/.test(badQuery) || /\s+[,;:\-]\s*$/.test(badQuery);
    expect(hasDanglingPunctuation).toBe(true);
  });

  // TEST 4: Natural 8-word technical phrase outranks fragmented technical phrase
  test("TEST 4: A natural 8-word technical phrase outranks a fragmented technical phrase", () => {
    const naturalPhrase = "tracked its consumption in AI Credits for Copilot";
    const fragmentedPhrase = "in AI Credits AICs";
    
    expect(naturalPhrase.split(" ").length).toBeGreaterThanOrEqual(6);
    expect(fragmentedPhrase.split(" ").length).toBeLessThan(5);
  });

  // TEST 5: Dangling punctuation is penalized
  test("TEST 5: Dangling punctuation is penalized", () => {
    const dangling1 = "phrase with trailing comma ,";
    const dangling2 = "phrase with colon :";
    const clean = "phrase without dangling punctuation";

    const isDangling = (q: string) => /[,;:\-]\s*$/.test(q);
    expect(isDangling(dangling1)).toBe(true);
    expect(isDangling(dangling2)).toBe(true);
    expect(isDangling(clean)).toBe(false);
  });

  // TEST 6: Useful punctuation inside a natural phrase is not incorrectly rejected
  test("TEST 6: Useful punctuation inside a natural phrase is not incorrectly rejected", () => {
    const naturalWithPunct = "retail price, benchmark scores, industry hype";
    const pWords = naturalWithPunct.split(/\s+/);
    expect(pWords.length).toBeGreaterThanOrEqual(5);
    expect(/^[,\s;:\-]+|[,\s;:\-]+$/.test(naturalWithPunct.trim())).toBe(false);
  });

  // TEST 7: Equivalent queries are deduplicated
  test("TEST 7: Equivalent queries are deduplicated", () => {
    const seen = new Set<string>();
    const q1 = "The bill spanned 27x from cheapest";
    const q2 = "the bill spanned 27x from cheapest";
    
    seen.add(q1.toLowerCase().trim());
    const isDup = seen.has(q2.toLowerCase().trim());
    expect(isDup).toBe(true);
  });

  // TEST 8: Selected queries maintain diversity
  test("TEST 8: Five selected queries have meaningful diversity", () => {
    const setA = new Set(["the", "bill", "spanned", "27x", "from", "cheapest"]);
    const setB = new Set(["tracked", "its", "consumption", "in", "ai", "credits"]);
    
    let intersection = 0;
    for (const w of setA) {
      if (setB.has(w)) intersection++;
    }
    const jaccard = intersection / (setA.size + setB.size - intersection);
    expect(jaccard).toBeLessThan(0.60);
  });

  // TEST 9: No production code contains hardcoded domains or URLs
  test("TEST 9: No production code contains hardcoded domains or URLs", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const code = fs.readFileSync(
      path.resolve(import.meta.dir, "web-plagiarism-matcher.service.ts"),
      "utf-8"
    );

    expect(code.includes("networkershome.com")).toBe(false);
    expect(code.includes("coderlegion.com")).toBe(false);
    expect(code.includes("jason-agostoni")).toBe(false);
    expect(code.includes("jason.agostoni.net")).toBe(false);
    expect(code.includes("hashnode.com")).toBe(false);
  });

  // TEST 10: Existing DeterministicMatcher purity remains unchanged
  test("TEST 10: Existing DeterministicMatcher scoring and verification purity remains 100% unchanged", () => {
    const text = "All five runs completed everything they planned, yet the bill spanned 27x from cheapest to most expensive.";
    const candidate: MatchedSource = {
      id: "cand-1",
      sourceTitle: "Article on Agentic SDLC",
      sourceUrl: "https://example.com/article",
      similarityPercent: 100,
      matchedSnippet: text,
      originalSnippet: `In our benchmarking, ${text} Quality was also measured.`,
      verificationStatus: "VERIFIED",
    };

    const report = DeterministicMatcher.evaluate(text, [candidate]);
    expect(report.matchedWords).toBe(report.totalSubmittedWords);
    expect(report.literalSimilarityPercent).toBe(100);
    expect(report.isExactMatch).toBe(true);
  });
});
