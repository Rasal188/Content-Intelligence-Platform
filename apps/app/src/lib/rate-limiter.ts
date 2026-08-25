import { convexAuthNextjsToken, isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";
import { NextResponse } from "next/server";

interface RateLimitBucket {
  count: number;
  resetTime: number;
}

// Thread-safe in-memory sliding window store for API rate-limiting per user
const rateLimitStore = new Map<string, RateLimitBucket>();

// Periodic cleanup of expired buckets every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of rateLimitStore.entries()) {
      if (now > bucket.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  if (typeof cleanupInterval.unref === "function") {
    cleanupInterval.unref();
  }
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  userId: string;
}

/**
 * Extracts authenticated user identifier and checks rate-limit bucket.
 * Policy: 10 requests per authenticated user per 1 minute window.
 *
 * @param routeKey Key representing the API route / domain
 * @param maxRequests Maximum allowed requests in window (default 10)
 * @param windowMs Window duration in milliseconds (default 60,000ms = 1m)
 */
export async function checkApiRateLimit(
  routeKey = "ai-gateway",
  maxRequests = 10,
  windowMs = 60 * 1000,
): Promise<RateLimitResult> {
  const isAuthed = await isAuthenticatedNextjs();
  if (!isAuthed) {
    return {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      retryAfterSeconds: 60,
      userId: "",
    };
  }

  // Derive stable server-side identity from authenticated JWT token
  const token = (await convexAuthNextjsToken()) || "authenticated-session";
  // Hash/compact token prefix for map key safety
  const identityKey = `${routeKey}:${token.slice(-32)}`;

  const now = Date.now();
  let bucket = rateLimitStore.get(identityKey);

  if (!bucket || now > bucket.resetTime) {
    bucket = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(identityKey, bucket);
    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      retryAfterSeconds: 0,
      userId: identityKey,
    };
  }

  if (bucket.count >= maxRequests) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetTime - now) / 1000));
    return {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      retryAfterSeconds: retryAfter,
      userId: identityKey,
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    limit: maxRequests,
    remaining: maxRequests - bucket.count,
    retryAfterSeconds: 0,
    userId: identityKey,
  };
}

/**
 * Standard 429 response helper with Retry-After and X-RateLimit headers.
 */
export function createRateLimitExceededResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": retryAfterSeconds.toString(),
        "X-RateLimit-Limit": "10",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": retryAfterSeconds.toString(),
      },
    },
  );
}
