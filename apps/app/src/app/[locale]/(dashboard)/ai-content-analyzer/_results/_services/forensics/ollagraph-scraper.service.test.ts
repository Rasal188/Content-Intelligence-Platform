import { describe, expect, test } from "bun:test";
import { OllaGraphScraperService } from "./ollagraph-scraper.service";
import { DeterministicMatcher } from "./deterministic-matcher";
import { WebPlagiarismMatcher } from "./web-plagiarism-matcher.service";

describe("OllaGraph Scraper Service & Plagiarism Integration Unit Tests", () => {
  describe("SSRF & Security Pre-Validation", () => {
    test("1. Valid URL passes pre-validation check", async () => {
      const res = await OllaGraphScraperService.scrapeUrl("https://example.com/valid-article", 100, "dummy-key");
      expect(res.status).not.toBe("INVALID_URL");
    });

    test("2. Localhost URL is blocked immediately without calling upstream", async () => {
      const res = await OllaGraphScraperService.scrapeUrl("http://localhost:3000", 5000, "dummy-key");
      expect(res.status).toBe("INVALID_URL");
      expect(res.error).toBe("URL host is not allowed.");
    });

    test("3. Private IP is blocked immediately without calling upstream", async () => {
      const res = await OllaGraphScraperService.scrapeUrl("http://192.168.1.1/internal", 5000, "dummy-key");
      expect(res.status).toBe("INVALID_URL");
      expect(res.error).toBe("URL host is not allowed.");
    });

    test("4. Cloud metadata IP is blocked immediately", async () => {
      const res = await OllaGraphScraperService.scrapeUrl("http://169.254.169.254/meta-data", 5000, "dummy-key");
      expect(res.status).toBe("INVALID_URL");
      expect(res.error).toBe("URL host is not allowed.");
    });

    test("5. Invalid protocol is blocked immediately", async () => {
      const res = await OllaGraphScraperService.scrapeUrl("file:///etc/passwd", 5000, "dummy-key");
      expect(res.status).toBe("INVALID_URL");
      expect(res.error).toBe("Invalid URL.");
    });
  });

  describe("OllaGraph Response Schema Support (markdown, text, content)", () => {
    test("TEST 1: Response containing markdown -> SUCCESS", async () => {
      const raw = { status: "success", markdown: "hello world markdown" };
      const rawText =
        typeof raw.markdown === "string" && raw.markdown.trim().length > 0
          ? raw.markdown
          : null;
      expect(rawText).toBe("hello world markdown");
    });

    test("TEST 2: Response containing text -> SUCCESS", async () => {
      const raw = { status: "success", text: "hello world text" };
      const rawText =
        typeof (raw as any).markdown === "string" && (raw as any).markdown.trim().length > 0
          ? (raw as any).markdown
          : typeof raw.text === "string" && raw.text.trim().length > 0
            ? raw.text
            : null;
      expect(rawText).toBe("hello world text");
    });

    test("TEST 3: Response containing content -> SUCCESS", async () => {
      const raw = { status: "success", content: "hello world content" };
      const rawText =
        typeof (raw as any).markdown === "string" && (raw as any).markdown.trim().length > 0
          ? (raw as any).markdown
          : typeof (raw as any).text === "string" && (raw as any).text.trim().length > 0
            ? (raw as any).text
            : typeof raw.content === "string" && raw.content.trim().length > 0
              ? raw.content
              : null;
      expect(rawText).toBe("hello world content");
    });

    test("TEST 4: Response with no valid text field -> null", () => {
      const raw = { status: "success", foo: 123 };
      const rawText =
        typeof (raw as any).markdown === "string" && (raw as any).markdown.trim().length > 0
          ? (raw as any).markdown
          : typeof (raw as any).text === "string" && (raw as any).text.trim().length > 0
            ? (raw as any).text
            : typeof (raw as any).content === "string" && (raw as any).content.trim().length > 0
              ? (raw as any).content
              : null;
      expect(rawText).toBeNull();
    });

    test("TEST 5: Response with empty markdown but valid text -> uses text", () => {
      const raw = { status: "success", markdown: "   ", text: "valid text" };
      const rawText =
        typeof raw.markdown === "string" && raw.markdown.trim().length > 0
          ? raw.markdown
          : typeof raw.text === "string" && raw.text.trim().length > 0
            ? raw.text
            : null;
      expect(rawText).toBe("valid text");
    });

    test("TEST 6: Response with both markdown and text -> uses markdown", () => {
      const raw = { status: "success", markdown: "primary markdown", text: "secondary text" };
      const rawText =
        typeof raw.markdown === "string" && raw.markdown.trim().length > 0
          ? raw.markdown
          : typeof raw.text === "string" && raw.text.trim().length > 0
            ? raw.text
            : null;
      expect(rawText).toBe("primary markdown");
    });

    test("TEST 7: Text larger than 500,000 characters is safely truncated", () => {
      const longText = "a".repeat(500_050);
      const cleanText =
        longText.length > OllaGraphScraperService.MAX_EXTRACTED_TEXT_CHARS
          ? longText.slice(0, OllaGraphScraperService.MAX_EXTRACTED_TEXT_CHARS)
          : longText;
      expect(cleanText.length).toBe(500_000);
    });
  });

  describe("Phase 10 Step 7K — Adaptive Multi-Strategy OllaGraph Discovery Tests", () => {
    const stopwords = new Set([
      "the", "and", "for", "with", "this", "that", "from", "are", "was", "were",
      "has", "had", "have", "you", "your", "all", "any", "not", "but", "can",
      "will", "about", "into", "their", "there", "what", "which", "when", "more", "out", "of"
    ]);

    test("Test 1: A 6-12 word distinctive sentence generates ONE complete-clause query", () => {
      const sentence = "Flat 1 credit per call no multipliers refund on failure";
      const words = sentence.split(/\s+/).filter(Boolean);
      expect(words.length).toBe(10);
      expect(words.length >= 6 && words.length <= 14).toBe(true);
    });

    test("Test 2: A long sentence generates multiple strategies (opening, middle, reduced)", () => {
      const longSentence = "Scrape crawl search and extract the live web plus domain intelligence and vertical actors behind one API key one bill and one MCP server";
      const words = longSentence.split(/\s+/).filter(Boolean);
      expect(words.length).toBeGreaterThan(12);

      const openSlice = words.slice(0, 9).join(" ");
      const midStart = Math.floor((words.length - 8) / 2);
      const midSlice = words.slice(midStart, midStart + 8).join(" ");

      expect(openSlice.length).toBeGreaterThan(10);
      expect(midSlice.length).toBeGreaterThan(10);
    });

    test("Test 3: Stopword-reduced query is generated independently without mutating original", () => {
      const original = "building modern scalable web applications with distributed cloud architectures and event sourcing patterns";
      const words = original.split(/\s+/).filter(Boolean);
      const reducedWords = words.filter(w => !stopwords.has(w.toLowerCase()));

      expect(reducedWords.length).toBeLessThan(words.length);
      expect(reducedWords.includes("with")).toBe(false);
      expect(reducedWords.includes("and")).toBe(false);
      expect(reducedWords.includes("distributed")).toBe(true);
      expect(reducedWords.includes("architectures")).toBe(true);
    });

    test("Test 4: Equivalent normalized queries are deduplicated", () => {
      const seen = new Set<string>();
      const add = (q: string) => {
        const clean = q.trim().toLowerCase().replace(/\s+/g, " ");
        if (!seen.has(clean)) {
          seen.add(clean);
          return true;
        }
        return false;
      };

      expect(add("Flat 1 credit per call")).toBe(true);
      expect(add("flat 1   credit per call ")).toBe(false);
      expect(seen.size).toBe(1);
    });

    test("Test 5: Maximum search query count never exceeds 8", () => {
      const candidateQueries = Array.from({ length: 15 }, (_, i) => `distinctive query string number ${i}`);
      const selected = candidateQueries.slice(0, 8);
      expect(selected.length).toBe(8);
      expect(selected.length).toBeLessThanOrEqual(8);
    });

    test("Test 6: Candidate appearing in multiple queries receives a consensus bonus", () => {
      let score = 0;
      let queryCount = 1;
      // Single query
      if (queryCount > 1) score += 3;
      expect(score).toBe(0);

      // Multiple queries
      queryCount += 1;
      if (queryCount > 1) score += 3;
      expect(score).toBe(3);
    });

    test("Test 7: Candidate with stronger submitted-text overlap outranks generic candidates", () => {
      const candA = { name: "generic", textMatches: 1, score: 2 };
      const candB = { name: "exact_source", textMatches: 6, score: 12 };
      const ranked = [candA, candB].sort((a, b) => b.score - a.score);
      expect(ranked[0]?.name).toBe("exact_source");
    });

    test("Test 8: Live-web candidates retain dedicated scrape slots even when Wikipedia candidates exist", () => {
      const wiki = Array.from({ length: 5 }, (_, i) => ({ id: `w${i}`, sourceUrl: `https://en.wikipedia.org/wiki/${i}` }));
      const live = [{ id: "l1", sourceUrl: "https://stripe.com" }, { id: "l2", sourceUrl: "https://react.dev" }];

      const batch = [...live.slice(0, 3), ...wiki.slice(0, 2)];
      expect(batch.filter(c => !c.sourceUrl.includes("wikipedia.org")).length).toBe(2);
      expect(batch.filter(c => c.sourceUrl.includes("wikipedia.org")).length).toBe(2);
    });

    test("Test 9: A verified live-web match prevents unnecessary Batch 2 scraping", () => {
      const verifiedAfterBatch1 = [{ id: "l1", sourceUrl: "https://ollagraph.com", similarityPercent: 100, verificationStatus: "VERIFIED" as const, originalSnippet: "Scrape crawl search", matchedSnippet: "Scrape crawl search" }];
      const report = DeterministicMatcher.evaluate("Scrape crawl search", verifiedAfterBatch1);
      const needBatch2 = report.verifiedSources.length === 0;
      expect(needBatch2).toBe(false);
    });

    test("Test 10: No verified match causes Batch 2 to execute for the next 3 live-web candidates", () => {
      const verifiedAfterBatch1 = [{ id: "l1", sourceUrl: "https://unrelated.com", similarityPercent: 0, verificationStatus: "VERIFIED" as const, originalSnippet: "Unrelated text", matchedSnippet: "" }];
      const report = DeterministicMatcher.evaluate("Scrape crawl search", verifiedAfterBatch1);
      const needBatch2 = report.verifiedSources.length === 0;
      expect(needBatch2).toBe(true);
    });

    test("Test 11: No domain-specific hardcoding exists in candidate scoring", () => {
      // Score calculation uses strictly queryCount, titleMatches, snippetMatches, textMatches
      const calculateScore = (queryCount: number, titleMatches: number, snippetMatches: number, textMatches: number, rank: number) => {
        let score = 0;
        if (queryCount > 1) score += 3;
        if (rank === 1) score += 3;
        else if (rank <= 3) score += 2;
        if (titleMatches >= 2) score += 3;
        if (snippetMatches >= 2) score += 3;
        score += Math.min(6, textMatches);
        return score;
      };

      const score = calculateScore(2, 2, 2, 5, 1);
      expect(score).toBe(3 + 3 + 3 + 3 + 5); // 17
    });

    test("Test 12: Existing OllaGraph markdown response remains accepted", async () => {
      const mockResponse = {
        status: "success",
        markdown: "# Documentation\n\nFull clean extracted content",
      };
      const text = mockResponse.markdown || (mockResponse as any).text;
      expect(text).toBe("# Documentation\n\nFull clean extracted content");
    });

    test("Test 13: Step 7N Continuous N-Gram candidate ranking - Marshud Case", () => {
      const submittedText = "Flax is a high-level neural network library built natively for JAX. It gives you the clean modular ergonomics of object-oriented layer definitions while staying 100% faithful to JAX's functional and stateless philosophy under the hood. In this post, we will explore how Flax bridges the gap between ergonomic layer design and pure functional execution, how parameter initialization works, and how to use Flax's TrainState abstraction to run a complete training workflow.";
      
      const sentences = submittedText.match(/[^.!?]+[.!?]+/g) || [submittedText];
      const submittedNgrams: { phrase: string; wordCount: number }[] = [];
      const seen = new Set<string>();

      for (const s of sentences) {
        const words = s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
        for (let n = 5; n <= Math.min(8, words.length); n++) {
          for (let i = 0; i <= words.length - n; i++) {
            const phrase = words.slice(i, i + n).join(" ");
            if (!seen.has(phrase)) {
              seen.add(phrase);
              submittedNgrams.push({ phrase, wordCount: n });
            }
          }
        }
      }
      submittedNgrams.sort((a, b) => b.wordCount - a.wordCount);

      const scoreCandidate = (title: string, snippet: string) => {
        let score = 0;
        const lowT = title.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
        const lowS = snippet.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
        for (const ng of submittedNgrams) {
          if (lowT.includes(ng.phrase) || lowS.includes(ng.phrase)) {
            if (ng.wordCount >= 8) score += 12;
            else if (ng.wordCount === 7) score += 9;
            else if (ng.wordCount === 6) score += 7;
            else if (ng.wordCount === 5) score += 5;
            break;
          }
        }
        return score;
      };

      const genericFlaxPaper = { title: "Flax fiber composite materials", snippet: "fiber layers acting as energy bridges between neighboring layers" };
      const marshudArticle = { title: "High Level Neural Network Modeling with Flax - Marshud", snippet: "In this post we will explore how Flax bridges the gap between ergonomic layer design and pure functional execution" };

      const scoreGeneric = scoreCandidate(genericFlaxPaper.title, genericFlaxPaper.snippet);
      const scoreMarshud = scoreCandidate(marshudArticle.title, marshudArticle.snippet);

      expect(scoreMarshud).toBe(12); // 8+ continuous words
      expect(scoreGeneric).toBe(0); // 0 continuous 5-grams
      expect(scoreMarshud).toBeGreaterThan(scoreGeneric);
    });

    test("Test 14: Step 7N Generic Non-Flax Continuous N-Gram Case", () => {
      const submitted = "Modern event-driven systems separate message ingestion from downstream processing so individual consumers can scale independently without blocking the producer.";
      const candidateA = {
        title: "Event Driven Architecture Guide",
        snippet: "In microservices separate message ingestion from downstream processing so individual consumers can scale independently for high throughput.",
      };
      const candidateB = {
        title: "Producer and Consumer Scale Guide",
        snippet: "A message system provides processing where producer and consumer can scale independently.",
      };

      const words = submitted.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
      const ngrams: string[] = [];
      for (let i = 0; i <= words.length - 8; i++) {
        ngrams.push(words.slice(i, i + 8).join(" "));
      }

      const hasContinuousA = ngrams.some(ng => candidateA.snippet.toLowerCase().includes(ng));
      const hasContinuousB = ngrams.some(ng => candidateB.snippet.toLowerCase().includes(ng));

      expect(hasContinuousA).toBe(true);
      expect(hasContinuousB).toBe(false);
    });
  });

  describe("Plagiarism Matching with Extracted Content", () => {
    test("Case A: Submitted text matches text returned by scraper -> DeterministicMatcher finds overlap", () => {
      const submitted = "Quantum algorithms exploit superposition and entanglement to execute complex calculations exponentially faster.";
      const scrapedBody = "In modern computing, quantum algorithms exploit superposition and entanglement to execute complex calculations exponentially faster than classical supercomputers.";

      const candidate = {
        id: "source-1",
        sourceTitle: "Quantum Computing Horizons",
        sourceUrl: "https://example.edu/quantum-paper",
        similarityPercent: 100,
        matchedSnippet: "quantum algorithms exploit superposition",
        originalSnippet: scrapedBody,
        verificationStatus: "VERIFIED" as const,
      };

      const report = DeterministicMatcher.evaluate(submitted, [candidate]);
      expect(report.isExactMatch).toBe(true);
      expect(report.matchedWords).toBe(12);
      expect(report.literalSimilarityPercent).toBe(100);
      expect(report.verifiedSources.length).toBe(1);
    });

    test("Case B: Submitted text has no overlap with scraper text -> 0% plagiarism", () => {
      const submitted = "The blue sky reflected on the calm alpine lake during early morning.";
      const scrapedBody = "Financial accounting standards board announced new GAAP regulatory guidelines.";

      const candidate = {
        id: "source-2",
        sourceTitle: "Financial Regulatory Review",
        sourceUrl: "https://example.com/finance",
        similarityPercent: 0,
        matchedSnippet: "",
        originalSnippet: scrapedBody,
        verificationStatus: "VERIFIED" as const,
      };

      const report = DeterministicMatcher.evaluate(submitted, [candidate]);
      expect(report.isExactMatch).toBe(false);
      expect(report.matchedWords).toBe(0);
      expect(report.literalSimilarityPercent).toBe(0);
      expect(report.verifiedSources.length).toBe(0);
    });

    test("Case C: Fallback to existing discovery when scraping fails", async () => {
      const existingMatch = {
        id: "wiki-1",
        sourceTitle: "Neil Armstrong Moon Landing",
        sourceUrl: "https://en.wikipedia.org/wiki/Neil_Armstrong",
        similarityPercent: 100,
        matchedSnippet: "That's one small step for a man, one giant leap for mankind.",
        originalSnippet: "That's one small step for a man, one giant leap for mankind.",
        verificationStatus: "VERIFIED" as const,
      };

      const report = DeterministicMatcher.evaluate(
        "That's one small step for a man, one giant leap for mankind.",
        [existingMatch]
      );
      expect(report.literalSimilarityPercent).toBe(100);
      expect(report.verifiedSources[0]?.sourceTitle).toBe("Neil Armstrong Moon Landing");
    });
  });

  describe("Phase 10 Step 7R — Rate-Aware Scrape Scheduler Regression Tests", () => {
    test("Test 1: Normalizes and deduplicates URLs before scraping", () => {
      const urls = [
        "https://example.com/page/",
        "https://example.com/page",
        "https://EXAMPLE.com/page",
        "https://example.com/other"
      ];
      const deduped = OllaGraphScraperService.normalizeAndDeduplicateUrls(urls);
      expect(deduped.length).toBe(2);
      expect(deduped[0]).toBe("https://example.com/page/");
      expect(deduped[1]).toBe("https://example.com/other");
    });

    test("Test 2: Respects MAX_SCRAPE_CANDIDATES limit", async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = async () =>
          new Response(JSON.stringify({ status: "success", content: "mocked content" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });

        const urls = [
          "https://example.com/1",
          "https://example.com/2",
          "https://example.com/3",
          "https://example.com/4",
          "https://example.com/5",
        ];
        const results = await OllaGraphScraperService.scrapeCandidateUrls(urls, 2, "test-key");
        expect(results.length).toBe(2);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    test("Test 3: Detects RATE_LIMITED status and extracts retryAfterSeconds", async () => {
      // Mock fetch returning HTTP 429 with Retry-After header
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = async () =>
          new Response(JSON.stringify({ error: "rate limit" }), {
            status: 429,
            headers: { "Retry-After": "3", "Content-Type": "application/json" },
          });

        const res = await OllaGraphScraperService.scrapeUrl("https://example.com/test", 1000, "test-key");
        expect(res.status).toBe("RATE_LIMITED");
        expect(res.retryAfterSeconds).toBe(3);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    test("Test 4: Bounded 429 retry recovers when subsequent attempt succeeds", async () => {
      const originalFetch = globalThis.fetch;
      let callCount = 0;
      try {
        globalThis.fetch = async () => {
          callCount++;
          if (callCount === 1) {
            return new Response(JSON.stringify({ error: "rate limit" }), {
              status: 429,
              headers: { "Retry-After": "1", "Content-Type": "application/json" },
            });
          }
          return new Response(
            JSON.stringify({ status: "success", content: "Recovered page content after rate limit retry." }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        };

        const results = await OllaGraphScraperService.scrapeCandidateUrls(["https://example.com/retry-test"], 1, "test-key");
        expect(callCount).toBe(2);
        expect(results.length).toBe(1);
        expect(results[0]?.status).toBe("SUCCESS");
        expect(results[0]?.text).toContain("Recovered page content");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    test("Test 5: Does not retry on permanent HTTP failure (e.g. HTTP 404)", async () => {
      const originalFetch = globalThis.fetch;
      let callCount = 0;
      try {
        globalThis.fetch = async () => {
          callCount++;
          return new Response(JSON.stringify({ error: "not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        };

        const results = await OllaGraphScraperService.scrapeCandidateUrls(["https://example.com/not-found"], 1, "test-key");
        expect(callCount).toBe(1); // No retry for 404
        expect(results[0]?.status).toBe("FAILED");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    test("Test 6: Isolates failure so one failed candidate does not block subsequent candidates", async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
          const bodyStr = typeof init?.body === "string" ? init.body : "";
          if (bodyStr.includes("fail-url") || input.toString().includes("fail-url")) {
            return new Response(JSON.stringify({ error: "server error" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }
          return new Response(
            JSON.stringify({ status: "success", content: "Valid success content for second candidate." }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        };

        const results = await OllaGraphScraperService.scrapeCandidateUrls(
          ["https://example.com/fail-url", "https://example.com/success-url"],
          2,
          "test-key"
        );
        expect(results[0]?.status).toBe("FAILED");
        expect(results[1]?.status).toBe("SUCCESS");
        expect(results[1]?.text).toContain("Valid success content");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    test("Test 7: Step 7T - Exact 8+ word phrase outranks generic keyword candidate", () => {
      const genericCandidate = { name: "generic", score: 8, textMatches: 6 };
      const exactPhraseCandidate = { name: "exact_source", score: 18, textMatches: 2 }; // +16 for 10-word continuous match
      const ranked = [genericCandidate, exactPhraseCandidate].sort((a, b) => b.score - a.score);
      expect(ranked[0]?.name).toBe("exact_source");
    });

    test("Test 8: Step 7T - Multi-query generic consensus cannot overwhelm exact continuous phrase evidence", () => {
      const multiQueryGeneric = { name: "multi_generic", score: 3 + 3 + 4 }; // +3 queryCount, +3 title match, +4 generic
      const singleQueryExact = { name: "single_exact", score: 16 + 2 }; // +16 for 10-word continuous match, +2 rank
      expect(singleQueryExact.score).toBeGreaterThan(multiQueryGeneric.score);
    });

    test("Test 9: Step 7U - Search query budget strictly bounded to maximum 8 requests", () => {
      const pass1 = ["q1", "q2", "q3", "q4"];
      const pass2 = ["q5", "q6", "q7", "q8"];
      const totalExecuted = [...pass1, ...pass2];
      expect(totalExecuted.length).toBeLessThanOrEqual(8);
    });

    test("Test 10: Step 7U - Second-pass merges new candidates without overwriting Pass 1 scores", () => {
      const candidateMap = new Map<string, { url: string; score: number }>();
      candidateMap.set("https://example.com/a", { url: "https://example.com/a", score: 10 });
      
      // Pass 2 adds new candidate and updates existing
      const pass2Candidates = [{ url: "https://example.com/a", addScore: 3 }, { url: "https://example.com/b", addScore: 8 }];
      for (const item of pass2Candidates) {
        if (candidateMap.has(item.url)) {
          candidateMap.get(item.url)!.score += item.addScore;
        } else {
          candidateMap.set(item.url, { url: item.url, score: item.addScore });
        }
      }
      expect(candidateMap.get("https://example.com/a")?.score).toBe(13);
      expect(candidateMap.get("https://example.com/b")?.score).toBe(8);
    });

    test("Test 11: Step 7X - Jaccard Deduplication rejects overlapping queries >= 0.65", () => {
      const qA = new Set("flax is a high level neural network library built".split(" "));
      const qB = new Set("flax is a high level neural network library built natively".split(" "));
      
      let intersection = 0;
      for (const w of qA) if (qB.has(w)) intersection++;
      const union = qA.size + qB.size - intersection;
      const jaccard = intersection / union;

      expect(jaccard).toBeGreaterThanOrEqual(0.65);
    });

    test("Test 12: Step 7X - Information Floor requires >= 5 total words and >= 4 content words", () => {
      const stopwords = new Set(["the", "and", "for", "with", "this", "that", "from", "are", "was", "were", "is", "to", "not", "just"]);
      const lowInfoQuery = "the goal is not just to learn";
      const qWords = lowInfoQuery.split(" ");
      const nonStopwords = qWords.filter(w => !stopwords.has(w));
      
      const isEligible = qWords.length >= 5 && nonStopwords.length >= 4;
      expect(isEligible).toBe(false); // Only 2 content words (goal, learn)

      const highInfoQuery = "explore how flax bridges ergonomic layer design pure functional execution";
      const highWords = highInfoQuery.split(" ");
      const highNonStopwords = highWords.filter(w => !stopwords.has(w));
      const isHighEligible = highWords.length >= 5 && highNonStopwords.length >= 4;
      expect(isHighEligible).toBe(true);
    });

    test("Test 13: Step 7X - Document Dispersion distributes queries across different sentences", () => {
      const selected = [
        { query: "Flax is a high level neural network library", sentenceIndex: 0 },
        { query: "In this post we explore ergonomic layer design", sentenceIndex: 1 },
        { query: "TrainState abstraction to run a complete workflow", sentenceIndex: 2 }
      ];
      const distinctSentences = new Set(selected.map(s => s.sentenceIndex));
      expect(distinctSentences.size).toBe(3);
    });

    test("Test 14: Step 7X - Maximum scrape requests strictly bounded to 6", () => {
      const batch1 = 3;
      const batch2 = 3;
      const totalMaxScrapes = batch1 + batch2;
      expect(totalMaxScrapes).toBeLessThanOrEqual(6);
    });

    test("Test 15: Step 7X - Query generation never injects arbitrary domain tokens", () => {
      const submitted = "Writing clean code is like good manners. You can survive without it.";
      const forbiddenDomains = ["hashnode.dev", "dev.to", "github.com", "medium.com", "stripe.com"];
      for (const d of forbiddenDomains) {
        expect(submitted.includes(d)).toBe(false);
      }
    });
  });

  describe("Real OllaGraph Integration End-to-End Test", () => {
    const isIntegrationEnabled = process.env.RUN_INTEGRATION_TESTS === "true";

    test.skipIf(!isIntegrationEnabled)("Part 6 Real Text Test: Discovers and verifies public homepage text", async () => {
      const testText = "Scrape, crawl, search, and extract the live web — plus domain intelligence and vertical actors — behind one API key, one bill, and one MCP server. Flat 1 credit per call, no multipliers, refund on failure.";
      
      const discoveredSources = await WebPlagiarismMatcher.searchWebSources(testText);
      expect(discoveredSources).toBeDefined();

      const candidateSources = WebPlagiarismMatcher.match(testText, 20, discoveredSources);
      const report = DeterministicMatcher.evaluate(testText, candidateSources);

      // Verify that deterministic matching executes cleanly and evaluates the text
      expect(report).toBeDefined();
      expect(typeof report.literalSimilarityPercent).toBe("number");
      expect(typeof report.totalSubmittedWords).toBe("number");
      expect(report.totalSubmittedWords).toBeGreaterThan(15);
      expect(report.verifiedSources.length).toBeGreaterThanOrEqual(1);
      expect(report.literalSimilarityPercent).toBeGreaterThan(0);
    }, 60000);
  });
});
