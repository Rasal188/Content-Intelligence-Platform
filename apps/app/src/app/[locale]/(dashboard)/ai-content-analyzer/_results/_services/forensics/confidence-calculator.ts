export interface MetricConfidenceBreakdown {
  overall: number;
  aiForensics: number;
  originality: number;
  similarity: number;
  readability: number;
}

/**
 * Calculator responsible for deriving distinct confidence metrics from statistical indicators agreement and coverage.
 */
export class ConfidenceCalculator {
  /**
   * Calculates overall report confidence from indicators variance.
   * @param aiForensics The aiForensics indicator results.
   * @returns Confidence score out of 100.
   */
  public static calculate(aiForensics: Record<string, any>): number {
    return ConfidenceCalculator.calculateAiConfidence(aiForensics);
  }

  /**
   * Computes individual confidence values for all 4 primary analysis pillars.
   */
  public static calculateAll(
    data: Record<string, any>,
    textContent = "",
  ): MetricConfidenceBreakdown {
    const aiForensics = data.aiForensics || {};
    const originalExpression = data.originalExpression || {};
    const similarityAnalysis = data.similarityAnalysis || {};
    const writingQuality = data.writingQuality || {};

    const wordCount = textContent ? textContent.trim().split(/\s+/).filter(Boolean).length : 50;

    const aiConfidence =
      ConfidenceCalculator.calculateAiConfidence(aiForensics, wordCount);
    const origConfidence =
      ConfidenceCalculator.calculateOrigConfidence(originalExpression, wordCount);
    const simConfidence =
      ConfidenceCalculator.calculateSimConfidence(similarityAnalysis, wordCount);
    const readConfidence =
      ConfidenceCalculator.calculateReadConfidence(writingQuality, wordCount);

    const overall = Math.round(
      aiConfidence * 0.4 +
        origConfidence * 0.3 +
        simConfidence * 0.15 +
        readConfidence * 0.15,
    );

    return {
      overall: Math.max(20, Math.min(98, overall)),
      aiForensics: aiConfidence,
      originality: origConfidence,
      similarity: simConfidence,
      readability: readConfidence,
    };
  }

  public static calculateAiConfidence(
    aiForensics: Record<string, any>,
    wordCount = 50,
  ): number {
    const normalizedScores: number[] = [];
    const aiIndicators = [
      "lexicalRepetition",
      "sentencePredictability",
      "transitionOveruse",
      "paragraphRhythm",
      "sentenceStructureRepetition",
      "templateLanguage",
      "genericWording",
      "confidenceInflation",
      "informationDensity",
      "hedgingLanguage",
      "stylisticConsistency",
      "hallucinationIndicators",
    ];
    const humanIndicators = [
      "personalExperience",
      "humanImperfections",
      "narrativeAuthenticity",
      "creativity",
      "emotionalAuthenticity",
      "sentenceBurstiness",
      "vocabularyDiversity",
      "contextSwitching",
    ];

    for (const key of aiIndicators) {
      const item = aiForensics[key];
      if (item && typeof item.score === "number")
        normalizedScores.push(item.score);
    }
    for (const key of humanIndicators) {
      const item = aiForensics[key];
      if (item && typeof item.score === "number")
        normalizedScores.push(100 - item.score);
    }

    return ConfidenceCalculator.deriveConfidence(normalizedScores, 20, 88, wordCount);
  }

  public static calculateOrigConfidence(
    originalExpression: Record<string, any>,
    wordCount = 50,
  ): number {
    const normalizedScores: number[] = [];
    const positiveIndicators = [
      "specificity",
      "uniqueWording",
      "lexicalDiversity",
      "concreteObservations",
      "originalExamples",
    ];
    const invertedIndicators = [
      "boilerplate",
      "marketingLanguage",
      "educationalFiller",
      "commonCliches",
      "genericExplanations",
    ];

    for (const key of positiveIndicators) {
      const item = originalExpression[key];
      if (item && typeof item.score === "number")
        normalizedScores.push(item.score);
    }
    for (const key of invertedIndicators) {
      const item = originalExpression[key];
      if (item && typeof item.score === "number")
        normalizedScores.push(100 - item.score);
    }

    return ConfidenceCalculator.deriveConfidence(normalizedScores, 10, 84, wordCount);
  }

  public static calculateSimConfidence(
    similarityAnalysis: Record<string, any>,
    wordCount = 50,
  ): number {
    const scores: number[] = [];
    for (const [, item] of Object.entries(similarityAnalysis)) {
      if (item && typeof (item as any).score === "number") {
        scores.push((item as any).score);
      }
    }
    return ConfidenceCalculator.deriveConfidence(scores, 8, 86, wordCount);
  }

  public static calculateReadConfidence(
    writingQuality: Record<string, any>,
    wordCount = 50,
  ): number {
    const scores: number[] = [];
    for (const [, item] of Object.entries(writingQuality)) {
      if (item && typeof (item as any).score === "number") {
        scores.push((item as any).score);
      }
    }
    return ConfidenceCalculator.deriveConfidence(scores, 10, 92, wordCount);
  }

  /**
   * Derives a confidence score from indicator consensus and sample size completeness.
   * @param scores Array of normalized indicator scores (0-100).
   * @param totalPossible Total number of indicators expected.
   * @param baseConfidence Baseline confidence for this analysis dimension.
   * @param wordCount Length of submitted text in words.
   */
  private static deriveConfidence(
    scores: number[],
    totalPossible: number,
    baseConfidence: number,
    wordCount: number,
  ): number {
    if (scores.length === 0) return 30;

    // Sample size penalty scaling
    // < 35 words: Low confidence tier (35% - 55% max)
    // 35 - 100 words: Moderate preliminary confidence (55% - 75%)
    // 100+ words: Full robust confidence band (75% - 98%)
    let sampleSizeMultiplier = 1.0;
    if (wordCount < 25) {
      sampleSizeMultiplier = 0.45;
    } else if (wordCount < 50) {
      sampleSizeMultiplier = 0.65;
    } else if (wordCount < 100) {
      sampleSizeMultiplier = 0.85;
    }

    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance =
      scores.reduce((a, b) => a + (b - mean) ** 2, 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // Certainty: distance from 50 (neutral). Strong human (<25) or AI (>75) signals yield high certainty.
    const signalStrength = Math.min(100, Math.abs(mean - 50) * 2.0);
    // Consensus: lower standard deviation = indicators agree with each other.
    const consensus = Math.max(0, 100 - stdDev * 1.5);
    // Completeness: proportion of indicators scored.
    const completeness = Math.min(
      1.0,
      scores.length / Math.max(1, totalPossible),
    );

    const dynamicFactor =
      (signalStrength * 0.4 + consensus * 0.4 + completeness * 100 * 0.2) / 100;
    const rawComputed = Math.round((baseConfidence * 0.65 + dynamicFactor * 35) * sampleSizeMultiplier);

    return Math.max(20, Math.min(98, rawComputed));
  }
}
