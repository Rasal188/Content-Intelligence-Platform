import { describe, expect, test } from "bun:test";
import { InputQualityAnalyzerService } from "./input-quality-analyzer.service";

describe("Input Quality Analyzer & Deterministic Classifiability Gate Suite", () => {
  test("1. Random unsegmented keystroke string -> INSUFFICIENT", () => {
    const text = "syasydfvsufvofsagftasyfgaiufyafssfvy";
    const res = InputQualityAnalyzerService.evaluate(text);
    expect(res.classifiable).toBe(false);
    expect(res.status).toBe("INSUFFICIENT");
    expect(res.confidence).toBe(0);
  });

  test("2. Repeated characters -> INSUFFICIENT", () => {
    const text = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const res = InputQualityAnalyzerService.evaluate(text);
    expect(res.classifiable).toBe(false);
    expect(res.status).toBe("INSUFFICIENT");
    expect(res.confidence).toBe(0);
  });

  test("3. Symbols only -> NON_LINGUISTIC", () => {
    const text = "!@#$%^&*()_+=-";
    const res = InputQualityAnalyzerService.evaluate(text);
    expect(res.classifiable).toBe(false);
    expect(res.status).toBe("NON_LINGUISTIC");
    expect(res.confidence).toBe(0);
  });

  test("4. Emojis only -> NON_LINGUISTIC", () => {
    const text = "😀😀😀😀😀😀😀😀😀😀";
    const res = InputQualityAnalyzerService.evaluate(text);
    expect(res.classifiable).toBe(false);
    expect(res.status).toBe("NON_LINGUISTIC");
    expect(res.confidence).toBe(0);
  });

  test("5. URL only -> NON_LINGUISTIC", () => {
    const text = "https://example.com/test";
    const res = InputQualityAnalyzerService.evaluate(text);
    expect(res.classifiable).toBe(false);
    expect(res.status).toBe("NON_LINGUISTIC");
    expect(res.confidence).toBe(0);
  });

  test("6. Genuine short human sentence -> LOW_CONFIDENCE (classifiable: true)", () => {
    const text = "I fixed the bug yesterday.";
    const res = InputQualityAnalyzerService.evaluate(text);
    expect(res.classifiable).toBe(true);
    expect(res.status).toBe("LOW_CONFIDENCE");
    expect(res.confidence).toBe(45);
  });

  test("7. Normal human paragraph -> CLASSIFIABLE", () => {
    const text = "The application architecture was refactored yesterday to optimize memory footprint and throughput.";
    const res = InputQualityAnalyzerService.evaluate(text);
    expect(res.classifiable).toBe(true);
    expect(res.status).toBe("CLASSIFIABLE");
    expect(res.confidence).toBeGreaterThanOrEqual(80);
  });

  test("8. Clearly AI-generated paragraph -> CLASSIFIABLE", () => {
    const text = "In today's fast-paced world, artificial intelligence plays a crucial role in enhancing productivity and driving transformative innovation.";
    const res = InputQualityAnalyzerService.evaluate(text);
    expect(res.classifiable).toBe(true);
    expect(res.status).toBe("CLASSIFIABLE");
  });

  test("9. Malayalam paragraph -> CLASSIFIABLE", () => {
    const text = "കേരളത്തിലെ പ്രകൃതിഭംഗിയും സംസ്കാരവും ലോകപ്രശസ്തമാണ്. വിനോദസഞ്ചാരികൾ വർഷംതോറും ഇവിടേക്ക് എത്തുന്നു.";
    const res = InputQualityAnalyzerService.evaluate(text);
    expect(res.classifiable).toBe(true);
    expect(res.metrics.detectedScript).toBe("malayalam");
    expect(res.status).toBe("CLASSIFIABLE");
  });

  test("10. Hindi paragraph -> CLASSIFIABLE", () => {
    const text = "कृत्रिम बुद्धिमत्ता आधुनिक युग में तकनीकी प्रगति का एक महत्वपूर्ण साधन बन चुकी है।";
    const res = InputQualityAnalyzerService.evaluate(text);
    expect(res.classifiable).toBe(true);
    expect(res.metrics.detectedScript).toBe("devanagari");
    expect(res.status).toBe("CLASSIFIABLE");
  });

  test("11. Malayalam-English Code-Switching -> CLASSIFIABLE", () => {
    const text = "ഞാൻ ഇന്നലെ Next.js പ്രൊജക്റ്റ് build ചെയ്തു, React Server Components നല്ല performance തരുന്നുണ്ട്.";
    const res = InputQualityAnalyzerService.evaluate(text);
    expect(res.classifiable).toBe(true);
    expect(res.metrics.detectedScript).toBe("mixed");
    expect(res.status).toBe("CLASSIFIABLE");
  });

  test("12. Technical documentation containing code identifiers -> CLASSIFIABLE", () => {
    const text = "Next.js 14.2.7 and Convex provide end-to-end type safety, streaming HTML responses over HTTP/2.";
    const res = InputQualityAnalyzerService.evaluate(text);
    expect(res.classifiable).toBe(true);
    expect(res.status).toBe("CLASSIFIABLE");
  });
});
