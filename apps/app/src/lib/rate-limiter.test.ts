import { describe, expect, test } from "bun:test";

interface RateLimitBucket {
  count: number;
  resetTime: number;
}

class TestRateLimiter {
  private store = new Map<string, RateLimitBucket>();

  check(identity: string, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    let bucket = this.store.get(identity);
    if (!bucket || now > bucket.resetTime) {
      bucket = { count: 1, resetTime: now + windowMs };
      this.store.set(identity, bucket);
      return { allowed: true, remaining: maxRequests - 1, retryAfterSeconds: 0 };
    }
    if (bucket.count >= maxRequests) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetTime - now) / 1000));
      return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter };
    }
    bucket.count += 1;
    return { allowed: true, remaining: maxRequests - bucket.count, retryAfterSeconds: 0 };
  }
}

describe("Rate Limiter Algorithm Tests", () => {
  test("Allows exactly 10 requests and rejects 11th with Retry-After", () => {
    const limiter = new TestRateLimiter();
    const user = "user-123";
    for (let i = 1; i <= 10; i++) {
      const res = limiter.check(user, 10, 60000);
      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(10 - i);
    }
    const rejected = limiter.check(user, 10, 60000);
    expect(rejected.allowed).toBe(false);
    expect(rejected.remaining).toBe(0);
    expect(rejected.retryAfterSeconds).toBeGreaterThan(0);
  });

  test("User A exhaustion does not block User B", () => {
    const limiter = new TestRateLimiter();
    for (let i = 1; i <= 10; i++) {
      limiter.check("user-a", 10, 60000);
    }
    expect(limiter.check("user-a", 10, 60000).allowed).toBe(false);
    expect(limiter.check("user-b", 10, 60000).allowed).toBe(true);
  });
});
