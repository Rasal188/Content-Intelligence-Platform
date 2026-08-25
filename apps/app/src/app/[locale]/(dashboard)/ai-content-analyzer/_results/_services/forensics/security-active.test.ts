import { describe, expect, test } from "bun:test";
import { OllaGraphScraperService } from "./ollagraph-scraper.service";
import { validateScrapeTargetUrl } from "@/lib/url-security";

describe("Phase 11B — SSRF & Edge Security Tests", () => {
  test("Blocks loopback, RFC1918, link-local, and cloud metadata addresses", async () => {
    const dangerousUrls = [
      "http://localhost:3000/secret",
      "http://127.0.0.1:8080/admin",
      "http://0.0.0.0/debug",
      "http://10.0.0.1/internal",
      "http://172.16.0.5/dashboard",
      "http://192.168.1.1/router",
      "http://[::1]/status",
      "http://[fe80::1]/link-local",
      "http://169.254.169.254/latest/meta-data/",
      "ftp://example.com/file",
      "file:///etc/passwd",
      "gopher://example.com",
    ];

    for (const url of dangerousUrls) {
      const validation = validateScrapeTargetUrl(url);
      expect(validation.valid).toBe(false);

      const res = await OllaGraphScraperService.scrapeUrl(url);
      expect(res.status).toBe("INVALID_URL");
      expect(res.text).toBeUndefined();
    }
  });

  test("Normalizes and rejects dangerous protocol variations", () => {
    const dangerousProtocols = [
      "javascript:alert(1)",
      "data:text/html,<html>",
      "ftp://ftp.example.com",
      "file:///etc/hosts",
    ];

    for (const url of dangerousProtocols) {
      const validation = validateScrapeTargetUrl(url);
      expect(validation.valid).toBe(false);
    }
  });
});
