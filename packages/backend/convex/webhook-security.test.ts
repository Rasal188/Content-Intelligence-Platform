import { describe, expect, test } from "bun:test";

async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  if (!a || !b) return false;
  const enc = new TextEncoder();
  const aBuf = await crypto.subtle.digest("SHA-256", enc.encode(a));
  const bBuf = await crypto.subtle.digest("SHA-256", enc.encode(b));
  const aArr = new Uint8Array(aBuf);
  const bArr = new Uint8Array(bBuf);
  let diff = 0;
  for (let i = 0; i < 32; i++) {
    diff |= (aArr[i] ?? 0) ^ (bArr[i] ?? 0);
  }
  return diff === 0;
}

describe("Webhook Constant-Time Comparison Unit Tests", () => {
  const SERVER_SECRET = "production_super_secret_webhook_key_xyz_12345";

  test("TEST 1: Missing request secret fails securely", async () => {
    expect(await timingSafeEqual("", SERVER_SECRET)).toBe(false);
  });

  test("TEST 2: Invalid secret fails securely", async () => {
    expect(await timingSafeEqual("wrong_secret_123", SERVER_SECRET)).toBe(false);
  });

  test("TEST 3: Valid matching secret succeeds", async () => {
    expect(await timingSafeEqual(SERVER_SECRET, SERVER_SECRET)).toBe(true);
  });

  test("TEST 4: Different-length secret fails securely without timing leak", async () => {
    expect(await timingSafeEqual("short", SERVER_SECRET)).toBe(false);
    expect(await timingSafeEqual(SERVER_SECRET + "_extra_long", SERVER_SECRET)).toBe(false);
  });

  test("TEST 5: Single character difference fails securely", async () => {
    const tampered = SERVER_SECRET.slice(0, -1) + "6";
    expect(await timingSafeEqual(tampered, SERVER_SECRET)).toBe(false);
  });
});
