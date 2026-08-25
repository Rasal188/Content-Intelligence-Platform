import { describe, expect, test } from "bun:test";
import { WritingAnalyzerService } from "./writing-analyzer.service";

describe("AI Humanizer Writing Analyzer & Preservation Validation Unit Tests", () => {
  const sampleAiText = `In today's fast-paced world, it is important to note that Next.js 14.2.7 plays a crucial role in building modern applications. Furthermore, our performance increased by 45.8% between January 2025 and March 2026. For complete documentation, visit https://docs.stripe.com/api or reference [Smith et al., 2024]. You can execute \`npm run build\` to verify output.`;

  test("1. Correctly analyzes writing metrics (sentences, words, variance, fillers)", () => {
    const analysis = WritingAnalyzerService.analyze(sampleAiText);
    expect(analysis.metrics.sentenceCount).toBeGreaterThanOrEqual(3);
    expect(analysis.metrics.wordCount).toBeGreaterThan(25);
    expect(analysis.metrics.fillerPhraseCount).toBeGreaterThanOrEqual(2);
    expect(analysis.issues.length).toBeGreaterThan(0);
  });

  test("2. Extracts strictly protected numbers, dates, URLs, code, and tech terms", () => {
    const analysis = WritingAnalyzerService.analyze(sampleAiText);
    const prot = analysis.protectedElements;

    // Numbers & Metrics
    expect(prot.numbers).toContain("14.2.7");
    expect(prot.numbers).toContain("45.8%");

    // Dates
    expect(prot.dates.some(d => d.includes("2025") || d.includes("2026"))).toBe(true);

    // URLs
    expect(prot.urls).toContain("https://docs.stripe.com/api");

    // Code snippets
    expect(prot.codeSnippets).toContain("`npm run build`");

    // Tech terms
    expect(prot.technicalTerms).toContain("Next.js");
  });

  test("3. Validates preservation: passes when all protected elements are retained", () => {
    const analysis = WritingAnalyzerService.analyze(sampleAiText);
    const validHumanized = `Modern apps move quickly, and Next.js 14.2.7 is right at the center of that shift. In fact, between January 2025 and March 2026, our team saw a 45.8% jump in performance. If you want the full story, head over to https://docs.stripe.com/api or check [Smith et al., 2024]. Simply run \`npm run build\` to confirm the results yourself.`;

    const validation = WritingAnalyzerService.validatePreservation(
      sampleAiText,
      validHumanized,
      analysis.protectedElements,
    );

    expect(validation.valid).toBe(true);
    expect(validation.missingElements.length).toBe(0);
    expect(validation.lengthRatio).toBeGreaterThan(0.7);
  });

  test("4. Validates preservation: rejects when critical numbers or code are dropped", () => {
    const analysis = WritingAnalyzerService.analyze(sampleAiText);
    const corruptedHumanized = `Apps move fast nowadays, and a popular framework helps a lot. We saw a big performance improvement recently. Check online docs or run the build command.`;

    const validation = WritingAnalyzerService.validatePreservation(
      sampleAiText,
      corruptedHumanized,
      analysis.protectedElements,
    );

    expect(validation.valid).toBe(false);
    expect(validation.missingElements.length).toBeGreaterThan(0);
  });

  test("5. Rejects empty or excessively truncated outputs", () => {
    const analysis = WritingAnalyzerService.analyze(sampleAiText);
    const emptyValidation = WritingAnalyzerService.validatePreservation(
      sampleAiText,
      "",
      analysis.protectedElements,
    );
    expect(emptyValidation.valid).toBe(false);

    const truncatedValidation = WritingAnalyzerService.validatePreservation(
      sampleAiText,
      "Too short.",
      analysis.protectedElements,
    );
    expect(truncatedValidation.valid).toBe(false);
  });
});
