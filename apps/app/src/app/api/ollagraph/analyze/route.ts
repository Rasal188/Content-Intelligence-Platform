import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";
import { NextResponse } from "next/server";
import {
  checkApiRateLimit,
  createRateLimitExceededResponse,
} from "@/lib/rate-limiter";

/**
 * Server-side proxy route for securing OllaGraph Content Analysis requests.
 * Enforces API key confidentiality and verified endpoint checking.
 */
export async function POST(req: Request) {
  // 1. Authentication check
  if (!(await isAuthenticatedNextjs())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Server-side Rate Limit check (10 requests/min per user)
  const rateLimit = await checkApiRateLimit(
    "ollagraph-analyze",
    10,
    60 * 1000,
  );
  if (!rateLimit.allowed) {
    return createRateLimitExceededResponse(rateLimit.retryAfterSeconds);
  }

  // 1. Enforce raw HTTP request body size limit (512 KB)
  const contentLength = req.headers.get("content-length");
  if (contentLength && Number.parseInt(contentLength, 10) > 512 * 1024) {
    return NextResponse.json(
      { error: "Request payload exceeds maximum allowed size (512 KB)." },
      { status: 413 },
    );
  }

  // 2. Parse JSON body with clean error handling (400 for malformed input)
  let body: { text?: unknown; mode?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid or malformed JSON payload." },
      { status: 400 },
    );
  }

  const { text, mode } = body;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json(
      { error: "Text payload is required for analysis." },
      { status: 400 },
    );
  }

  // 3. Enforce maximum text character limit (50,000 chars)
  if (text.length > 50000) {
    return NextResponse.json(
      { error: "Text payload exceeds the maximum allowed length." },
      { status: 413 },
    );
  }

  try {

    const apiKey = process.env.OLLAGRAPH_API_KEY;
    const apiUrl = process.env.OLLAGRAPH_API_URL;

    // Verify key configuration
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OllaGraph API Key not configured. Please set OLLAGRAPH_API_KEY in .env.local",
        },
        { status: 400 },
      );
    }

    // Enforce validated endpoint constraint
    if (!apiUrl || apiUrl === "<verified endpoint>" || apiUrl === "") {
      return NextResponse.json(
        {
          error:
            "Requires verified OllaGraph endpoint before implementation. Configure OLLAGRAPH_API_URL in .env.local",
        },
        { status: 400 },
      );
    }

    // Call the verified OllaGraph endpoint with a 10s request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ text, mode }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json(
          { error: `OllaGraph API returned status code ${response.status}` },
          { status: response.status },
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr instanceof Error && fetchErr.name === "AbortError") {
        return NextResponse.json(
          { error: "OllaGraph API request timed out" },
          { status: 504 },
        );
      }
      throw fetchErr;
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}
