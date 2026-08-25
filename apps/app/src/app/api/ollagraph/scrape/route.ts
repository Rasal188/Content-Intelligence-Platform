import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";
import { NextResponse } from "next/server";
import {
  checkApiRateLimit,
  createRateLimitExceededResponse,
} from "@/lib/rate-limiter";
import { validateScrapeTargetUrl } from "@/lib/url-security";

/**
 * Server-side proxy route for securing OllaGraph Web Scrape / Extraction requests.
 */
export async function POST(req: Request) {
  // 1. Authentication check
  if (!(await isAuthenticatedNextjs())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Server-side Rate Limit check (10 requests/min per user)
  const rateLimit = await checkApiRateLimit("ollagraph-scrape", 10, 60 * 1000);
  if (!rateLimit.allowed) {
    return createRateLimitExceededResponse(rateLimit.retryAfterSeconds);
  }

  // 1. Enforce raw HTTP request body size limit (64 KB for scrape requests)
  const contentLength = req.headers.get("content-length");
  if (contentLength && Number.parseInt(contentLength, 10) > 64 * 1024) {
    return NextResponse.json(
      { error: "Request payload exceeds maximum allowed size (64 KB)." },
      { status: 413 },
    );
  }

  // 2. Parse JSON body with clean error handling (400 for malformed input)
  let body: { url?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid or malformed JSON payload." },
      { status: 400 },
    );
  }

  const { url } = body;

  // 3. Strict URL & SSRF Validation (Protocols, Private IPs, Loopback, Metadata)
  const validation = validateScrapeTargetUrl(url);
  if (!validation.valid || !validation.normalizedUrl) {
    return NextResponse.json(
      { error: validation.error || "Invalid URL." },
      { status: 400 },
    );
  }

  const targetUrl = validation.normalizedUrl;

  try {

    const apiKey = process.env.OLLAGRAPH_API_KEY;
    const scrapeUrl = "https://api.ollagraph.com/v1/scrape";

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OllaGraph API Key not configured. Please set OLLAGRAPH_API_KEY in .env.local",
        },
        { status: 400 },
      );
    }

    const response = await fetch(scrapeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ url: targetUrl, extract: true }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `OllaGraph scrape returned status code ${response.status}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json({ text: data.text || "" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}
