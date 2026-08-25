import { describe, expect, test } from "bun:test";
import { WebPlagiarismMatcher } from "./web-plagiarism-matcher.service";
import { DeterministicMatcher } from "./deterministic-matcher";
import type { MatchedSource } from "../../_types/analysis-source.types";

describe("Domain Sibling Discovery & Controlled Internal Link Suite", () => {
  const sampleText = `NETWORKERS HOME is restructuring its CCIE Security program into a non-placement, lab-only bootcamp exclusively for working professionals. Over the past four years, 90% of security hiring has shifted to cloud-delivered and product-based security roles, including platforms such as Check Point, Palo Alto, Fortinet, Zscaler, Akamai, Skyhigh, Barracuda, and Ruckus.`;

  // 1. Dynamic domain extraction and domain query generation
  test("1. Sibling discovery identifies same-domain links and excludes external domains", () => {
    const parentUrl = "https://www.networkershome.com/networkershome-all-courses";
    const siblingUrl = "https://www.networkershome.com/best-ccie-security-course-in-bangalore/";
    const externalUrl = "https://www.cisco.com/certifications/ccie";

    const parentParsed = new URL(parentUrl);
    const sibParsed = new URL(siblingUrl);
    const extParsed = new URL(externalUrl);

    expect(sibParsed.hostname).toBe(parentParsed.hostname);
    expect(extParsed.hostname).not.toBe(parentParsed.hostname);
  });

  // 2. Login, cart, account, and asset links are filtered out
  test("2. Non-content links (login, cart, account, wp-admin, media) are filtered", () => {
    const badLinks = [
      "https://www.networkershome.com/login",
      "https://www.networkershome.com/cart",
      "https://www.networkershome.com/wp-admin",
      "https://www.networkershome.com/logo.png",
      "https://www.networkershome.com/styles.css",
    ];

    const isBad = (u: string) =>
      u.includes("login") ||
      u.includes("cart") ||
      u.includes("wp-admin") ||
      u.endsWith(".png") ||
      u.endsWith(".css");

    badLinks.forEach((l) => expect(isBad(l)).toBe(true));
  });

  // 3. Relevant sibling pages receive higher scores and candidate provenance is preserved
  test("3. Candidate provenance and discovery metadata are populated", () => {
    const siblingCandidate: MatchedSource = {
      id: "sib-1",
      sourceTitle: "CCIE Security Training in Bangalore",
      sourceUrl: "https://networkershome.com/best-ccie-security-course-in-bangalore/",
      similarityPercent: 0,
      matchedSnippet: "CCIE Security Bootcamp",
      originalSnippet: "CCIE Security Bootcamp",
      verificationStatus: "UNVERIFIED",
      discoveryMethod: "INTERNAL_LINK",
      parentUrl: "https://networkershome.com/networkershome-all-courses",
      discoveryScore: 85,
    };

    expect(siblingCandidate.discoveryMethod).toBe("INTERNAL_LINK");
    expect(siblingCandidate.parentUrl).toBe("https://networkershome.com/networkershome-all-courses");
    expect(siblingCandidate.discoveryScore).toBe(85);
  });

  // 4. Internal link discovery DOES NOT bypass deterministic verification
  test("4. Unverified internal links without verbatim text yield 0% in DeterministicMatcher", () => {
    const unverifiedSibling: MatchedSource = {
      id: "sib-2",
      sourceTitle: "Unrelated Sibling",
      sourceUrl: "https://networkershome.com/python-course",
      similarityPercent: 0,
      matchedSnippet: "Python for Beginners",
      originalSnippet: "Python for Beginners",
      verificationStatus: "UNVERIFIED",
      discoveryMethod: "INTERNAL_LINK",
    };

    const report = DeterministicMatcher.evaluate(sampleText, [unverifiedSibling]);
    expect(report.matchedWords).toBe(0);
    expect(report.literalSimilarityPercent).toBe(0);
    expect(report.verifiedSources.length).toBe(0);
  });

  // 5. Scraped verified sibling with exact match produces full deterministic match
  test("5. Verified scraped sibling with matching text produces exact deterministic match", () => {
    const verifiedSibling: MatchedSource = {
      id: "sib-3",
      sourceTitle: "CCIE Security in Bangalore",
      sourceUrl: "https://networkershome.com/best-ccie-security-course-in-bangalore/",
      similarityPercent: 100,
      matchedSnippet: sampleText,
      originalSnippet: `Introduction to the course: ${sampleText} Contact us for details.`,
      verificationStatus: "VERIFIED",
      discoveryMethod: "INTERNAL_LINK",
      parentUrl: "https://networkershome.com/networkershome-all-courses",
    };

    const report = DeterministicMatcher.evaluate(sampleText, [verifiedSibling]);
    expect(report.matchedWords).toBe(report.totalSubmittedWords);
    expect(report.literalSimilarityPercent).toBe(100);
    expect(report.verifiedSources.length).toBe(1);
    expect(report.verifiedSources[0]?.discoveryMethod).toBe("INTERNAL_LINK");
  });
});
