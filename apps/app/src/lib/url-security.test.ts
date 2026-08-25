import { describe, expect, test } from "bun:test";
import { validateScrapeTargetUrl } from "./url-security";

describe("SSRF & URL Security Validator Tests", () => {
  describe("VALID PUBLIC TARGET URLS", () => {
    const validUrls = [
      "https://example.com",
      "http://example.com",
      "https://www.wikipedia.org",
      "https://example.com/path?q=test",
      "HTTPS://EXAMPLE.COM/DOCS",
      "https://sub.domain.co.uk/page.html",
      "http://example.com:8080/feed",
    ];

    for (const url of validUrls) {
      test(`Accepts valid URL: ${url}`, () => {
        const res = validateScrapeTargetUrl(url);
        expect(res.valid).toBe(true);
        expect(res.normalizedUrl).toBeDefined();
        expect(res.error).toBeUndefined();
      });
    }
  });

  describe("BLOCKED PROTOCOLS & USERINFO", () => {
    const badProtocolUrls = [
      "javascript:alert(1)",
      "data:text/html,test",
      "file:///etc/passwd",
      "ftp://example.com",
      "ws://example.com",
      "wss://example.com",
      "https://user:password@example.com",
      "http://admin:secret@1.2.3.4",
      "gopher://example.com",
    ];

    for (const url of badProtocolUrls) {
      test(`Rejects disallowed protocol or userinfo: ${url}`, () => {
        const res = validateScrapeTargetUrl(url);
        expect(res.valid).toBe(false);
        expect(res.error).toBe("Invalid URL.");
      });
    }
  });

  describe("BLOCKED LOCALHOST, LOOPBACK & LOCAL HOSTNAMES", () => {
    const localhostUrls = [
      "localhost",
      "http://localhost",
      "http://localhost:3000",
      "http://localhost.",
      "http://LOCALHOST",
      "http://app.localhost",
      "http://127.0.0.1",
      "http://127.0.0.1:3000",
      "http://127.0.0.1.",
      "http://127.1.2.3",
      "http://0.0.0.0",
      "http://[::1]",
      "http://[0:0:0:0:0:0:0:1]",
      "http://[::ffff:127.0.0.1]",
    ];

    for (const url of localhostUrls) {
      test(`Rejects loopback/local host: ${url}`, () => {
        const res = validateScrapeTargetUrl(url);
        expect(res.valid).toBe(false);
        expect(["URL host is not allowed.", "Invalid URL."]).toContain(res.error!);
      });
    }
  });

  describe("BLOCKED PRIVATE CIDR & CLOUD METADATA RANGES", () => {
    const privateAndMetadataUrls = [
      "http://169.254.169.254",
      "http://169.254.169.254/latest/meta-data/",
      "http://10.0.0.1",
      "http://10.254.0.1/admin",
      "http://172.16.0.1",
      "http://172.31.255.255",
      "http://192.168.1.1",
      "http://192.168.0.100",
      "http://100.64.0.1",
      "http://100.127.255.255",
      "http://[fc00::1]",
      "http://[fd12:3456:789a::1]",
      "http://[fe80::1]",
      "http://[::ffff:169.254.169.254]",
      "http://[::ffff:192.168.1.1]",
    ];

    for (const url of privateAndMetadataUrls) {
      test(`Rejects private/metadata destination: ${url}`, () => {
        const res = validateScrapeTargetUrl(url);
        expect(res.valid).toBe(false);
        expect(res.error).toBe("URL host is not allowed.");
      });
    }
  });

  describe("MALFORMED & EMPTY URLS", () => {
    const malformed = [
      "",
      "   ",
      null,
      undefined,
      "not a url",
      "http://",
      "https://",
      "http:///path",
    ];

    for (const item of malformed) {
      test(`Rejects malformed input: ${item}`, () => {
        const res = validateScrapeTargetUrl(item);
        expect(res.valid).toBe(false);
        expect(res.error).toBe("Invalid URL.");
      });
    }
  });
});
