import { validateScrapeTargetUrl } from "@/lib/url-security";

export type OllaGraphScrapeStatus =
  | "SUCCESS"
  | "FAILED"
  | "TIMEOUT"
  | "RATE_LIMITED"
  | "INVALID_URL";

export interface OllaGraphScrapeResult {
  status: OllaGraphScrapeStatus;
  url: string;
  text?: string;
  error?: string;
  retryAfterSeconds?: number;
}

export interface OllaGraphSearchResult {
  title: string;
  url: string;
  snippet: string;
}

/**
 * Server-side client integrating directly with upstream OllaGraph Search & Scrape APIs.
 * Provides failure-isolation, strict timeouts, SSRF guard verification, and text truncation.
 */
export class OllaGraphScraperService {
  private static readonly SEARCH_ENDPOINT = "https://api.ollagraph.com/v1/search";
  private static readonly SCRAPE_ENDPOINT = "https://api.ollagraph.com/v1/scrape";
  private static readonly DEFAULT_TIMEOUT_MS = 5000;
  public static readonly MAX_EXTRACTED_TEXT_CHARS = 500_000;
  public static readonly MAX_SCRAPE_CANDIDATES = 3;

  public static readonly SEARCH_MAX_ATTEMPTS = 3;
  public static readonly SEARCH_RETRY_DELAYS_MS = [500, 1000];

  /**
   * Searches the public web using OllaGraph's real-time search API with bounded retry for transient failures.
   */
  public static async searchWeb(
    query: string,
    timeoutMs = OllaGraphScraperService.DEFAULT_TIMEOUT_MS,
    apiKeyOverride?: string,
    maxAttempts = OllaGraphScraperService.SEARCH_MAX_ATTEMPTS,
  ): Promise<OllaGraphSearchResult[]> {
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return [];
    }

    const apiKey = apiKeyOverride || process.env.OLLAGRAPH_API_KEY;
    if (!apiKey) {
      console.warn("[OLLAGRAPH_SEARCH_FAILED] Missing OLLAGRAPH_API_KEY");
      return [];
    }

    const cleanQuery = query.trim();

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`[OLLAGRAPH_SEARCH_ATTEMPT] query="${cleanQuery}" attempt=${attempt}/${maxAttempts}`);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(OllaGraphScraperService.SEARCH_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ query: cleanQuery }),
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (!res.ok) {
          console.warn(`[OLLAGRAPH_SEARCH_ERROR] query="${cleanQuery}" status=${res.status} attempt=${attempt}`);
          if (attempt < maxAttempts) {
            const delay = OllaGraphScraperService.SEARCH_RETRY_DELAYS_MS[attempt - 1] || 1000;
            console.log(`[OLLAGRAPH_SEARCH_RETRY] query="${cleanQuery}" retryIn=${delay}ms`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          console.error(`[OLLAGRAPH_SEARCH_FAILED] query="${cleanQuery}" failed after ${maxAttempts} attempts with status ${res.status}`);
          return [];
        }

        const data = (await res.json()) as any;
        if (!data || typeof data !== "object" || !Array.isArray(data.results)) {
          console.warn(`[OLLAGRAPH_SEARCH_ERROR] query="${cleanQuery}" invalid response structure attempt=${attempt}`);
          if (attempt < maxAttempts) {
            const delay = OllaGraphScraperService.SEARCH_RETRY_DELAYS_MS[attempt - 1] || 1000;
            console.log(`[OLLAGRAPH_SEARCH_RETRY] query="${cleanQuery}" retryIn=${delay}ms`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          return [];
        }

        // If results array is empty, treat as potential transient drop and retry if attempts remain
        if (data.results.length === 0) {
          console.log(`[OLLAGRAPH_SEARCH_EMPTY] query="${cleanQuery}" returned empty array attempt=${attempt}/${maxAttempts}`);
          if (attempt < maxAttempts) {
            const delay = OllaGraphScraperService.SEARCH_RETRY_DELAYS_MS[attempt - 1] || 1000;
            console.log(`[OLLAGRAPH_SEARCH_RETRY] query="${cleanQuery}" retryIn=${delay}ms after empty response`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          // After all retries, if still empty:
          console.log(`[OLLAGRAPH_SEARCH_EMPTY_FINAL] query="${cleanQuery}" yielded 0 results after ${maxAttempts} attempts`);
          return [];
        }

        const validResults: OllaGraphSearchResult[] = [];
        const seenUrls = new Set<string>();

        for (const item of data.results) {
          if (!item || typeof item !== "object") continue;
          const title = typeof item.title === "string" ? item.title.trim() : "";
          const rawUrl = typeof item.url === "string" ? item.url.trim() : "";
          const snippet = typeof item.snippet === "string" ? item.snippet.trim() : "";

          if (!rawUrl) continue;

          // SSRF & protocol validation check
          const validation = validateScrapeTargetUrl(rawUrl);
          if (!validation.valid || !validation.normalizedUrl) {
            continue;
          }

          const normUrl = validation.normalizedUrl;
          if (!seenUrls.has(normUrl)) {
            seenUrls.add(normUrl);
            validResults.push({
              title: title || normUrl,
              url: normUrl,
              snippet,
            });
          }
        }

        console.log(`[OLLAGRAPH_SEARCH_SUCCESS] query="${cleanQuery}" resultsCount=${validResults.length}`);
        return validResults;
      } catch (err: unknown) {
        clearTimeout(timer);
        const isTimeout = err instanceof Error && err.name === "AbortError";
        console.warn(`[OLLAGRAPH_SEARCH_ERROR] query="${cleanQuery}" error=${isTimeout ? "TIMEOUT" : String(err)} attempt=${attempt}`);
        if (attempt < maxAttempts) {
          const delay = OllaGraphScraperService.SEARCH_RETRY_DELAYS_MS[attempt - 1] || 1000;
          console.log(`[OLLAGRAPH_SEARCH_RETRY] query="${cleanQuery}" retryIn=${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        console.error(`[OLLAGRAPH_SEARCH_FAILED] query="${cleanQuery}" failed after ${maxAttempts} attempts`);
        return [];
      }
    }

    return [];
  }

  /**
   * Scrapes a single candidate URL with strict timeout and validation.
   */
  public static async scrapeUrl(
    rawUrl: string,
    timeoutMs = OllaGraphScraperService.DEFAULT_TIMEOUT_MS,
    apiKeyOverride?: string,
  ): Promise<OllaGraphScrapeResult> {
    // 1. SSRF & URL Validation Guard
    const validation = validateScrapeTargetUrl(rawUrl);
    if (!validation.valid || !validation.normalizedUrl) {
      return {
        status: "INVALID_URL",
        url: rawUrl,
        error: validation.error || "Invalid URL.",
      };
    }

    const targetUrl = validation.normalizedUrl;
    const apiKey = apiKeyOverride || process.env.OLLAGRAPH_API_KEY;

    if (!apiKey) {
      return {
        status: "FAILED",
        url: targetUrl,
        error: "OLLAGRAPH_API_KEY is not configured.",
      };
    }

    // 2. Timeout-bounded fetch execution
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(OllaGraphScraperService.SCRAPE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ url: targetUrl }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        if (res.status === 429) {
          const retryHeader = res.headers.get("retry-after");
          const retrySeconds = retryHeader ? Math.min(5, Math.max(1, Number.parseInt(retryHeader, 10) || 2)) : 2;
          return {
            status: "RATE_LIMITED",
            url: targetUrl,
            error: "Upstream rate limit exceeded (HTTP 429).",
            retryAfterSeconds: retrySeconds,
          };
        }
        return {
          status: "FAILED",
          url: targetUrl,
          error: `Upstream returned status ${res.status}`,
        };
      }

      let data: unknown;
      try {
        data = await res.json();
      } catch {
        return {
          status: "FAILED",
          url: targetUrl,
          error: "Malformed JSON response from upstream.",
        };
      }

      if (!data || typeof data !== "object") {
        return {
          status: "FAILED",
          url: targetUrl,
          error: "Invalid response format.",
        };
      }

      const resObj = data as Record<string, unknown>;
      const rawText =
        typeof resObj.markdown === "string" && resObj.markdown.trim().length > 0
          ? resObj.markdown
          : typeof resObj.text === "string" && resObj.text.trim().length > 0
            ? resObj.text
            : typeof resObj.content === "string" && resObj.content.trim().length > 0
              ? resObj.content
              : null;

      if (!rawText) {
        return {
          status: "FAILED",
          url: targetUrl,
          error: "No text content extracted.",
        };
      }

      // 3. Text Size Safety (Truncate to safe maximum)
      const cleanText =
        rawText.length > OllaGraphScraperService.MAX_EXTRACTED_TEXT_CHARS
          ? rawText.slice(0, OllaGraphScraperService.MAX_EXTRACTED_TEXT_CHARS)
          : rawText;

      return {
        status: "SUCCESS",
        url: targetUrl,
        text: cleanText,
      };
    } catch (err: unknown) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === "AbortError") {
        return {
          status: "TIMEOUT",
          url: targetUrl,
          error: "Scrape request timed out after 5s.",
        };
      }
      return {
        status: "FAILED",
        url: targetUrl,
        error: "Network or upstream failure.",
      };
    }
  }

  /**
   * Normalizes and deduplicates an array of candidate URLs.
   */
  public static normalizeAndDeduplicateUrls(urls: string[]): string[] {
    const seen = new Set<string>();
    const deduplicated: string[] = [];

    for (const u of urls) {
      if (!u || typeof u !== "string" || u.trim().length === 0) continue;
      try {
        const parsed = new URL(u.trim());
        let norm = `${parsed.protocol}//${parsed.hostname.toLowerCase()}${parsed.pathname}`;
        if (norm.endsWith("/") && parsed.pathname !== "/") {
          norm = norm.slice(0, -1);
        }
        if (parsed.search) {
          norm += parsed.search;
        }
        if (!seen.has(norm)) {
          seen.add(norm);
          deduplicated.push(u.trim());
        }
      } catch {
        // Leave to validateScrapeTargetUrl to catch
        if (!seen.has(u.trim())) {
          seen.add(u.trim());
          deduplicated.push(u.trim());
        }
      }
    }

    return deduplicated;
  }

  /**
   * Scrapes up to candidate URLs using a rate-aware sequential scheduler with bounded 429 retry.
   */
  public static async scrapeCandidateUrls(
    urls: string[],
    maxCandidates = OllaGraphScraperService.MAX_SCRAPE_CANDIDATES,
    apiKeyOverride?: string,
  ): Promise<OllaGraphScrapeResult[]> {
    const uniqueUrls = OllaGraphScraperService.normalizeAndDeduplicateUrls(urls);
    const selected = uniqueUrls.slice(0, maxCandidates);

    if (selected.length === 0) return [];

    const results: OllaGraphScrapeResult[] = [];

    for (let i = 0; i < selected.length; i++) {
      const url = selected[i]!;
      let res = await OllaGraphScraperService.scrapeUrl(
        url,
        OllaGraphScraperService.DEFAULT_TIMEOUT_MS,
        apiKeyOverride,
      );

      // Bounded retry (max 1 retry) if rate limited with respect to Retry-After
      if (res.status === "RATE_LIMITED") {
        const waitMs = (res.retryAfterSeconds || 2) * 1000;
        await new Promise((resolve) => setTimeout(resolve, Math.min(waitMs, 3000)));
        res = await OllaGraphScraperService.scrapeUrl(
          url,
          OllaGraphScraperService.DEFAULT_TIMEOUT_MS,
          apiKeyOverride,
        );
      }

      results.push(res);
    }

    return results;
  }
}
