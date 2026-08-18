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
    return this.calculateAiConfidence(aiForensics);
  }

  /**
   * Computes individual confidence values for all 4 primary analysis pillars.
   */
  public static calculateAll(data: Record<string, any>): MetricConfidenceBreakdown {
    const aiForensics = data.aiForensics || {};
    const originalExpression = data.originalExpression || {};
    const similarityAnalysis = data.similarityAnalysis || {};
    const writingQuality = data.writingQuality || {};

    const aiConfidence = this.calculateAiConfidence(aiForensics);
    const origConfidence = this.calculateOrigConfidence(originalExpression);
    const simConfidence = this.calculateSimConfidence(similarityAnalysis);
    const readConfidence = this.calculateReadConfidence(writingQuality);

    const overall = Math.round(
      aiConfidence * 0.4 +
      origConfidence * 0.3 +
      simConfidence * 0.15 +
      readConfidence * 0.15
    );

    return {
      overall: Math.max(35, Math.min(95, overall)),
      aiForensics: aiConfidence,
      originality: origConfidence,
      similarity: simConfidence,
      readability: readConfidence,
    };
  }

  public static calculateAiConfidence(aiForensics: Record<string, any>): number {
    const normalizedScores: number[] = [];
    const aiIndicators = [
      "lexicalRepetition", "sentencePredictability", "transitionOveruse",
      "paragraphRhythm", "sentenceStructureRepetition", "templateLanguage",
      "genericWording", "confidenceInflation", "informationDensity",
      "hedgingLanguage", "stylisticConsistency", "hallucinationIndicators",
    ];
    const humanIndicators = [
      "personalExperience", "humanImperfections", "narrativeAuthenticity",
      "creativity", "emotionalAuthenticity", "sentenceBurstiness",
      "vocabularyDiversity", "contextSwitching",
    ];

    for (const key of aiIndicators) {
      const item = aiForensics[key];
      if (item && typeof item.score === "number") normalizedScores.push(item.score);
    }
    for (const key of humanIndicators) {
      const item = aiForensics[key];
      if (item && typeof item.score === "number") normalizedScores.push(100 - item.score);
    }

    return this.deriveConfidence(normalizedScores, 20, 88);
  }

  public static calculateOrigConfidence(originalExpression: Record<string, any>): number {
    const normalizedScores: number[] = [];
    const positiveIndicators = ["specificity", "uniqueWording", "lexicalDiversity", "concreteObservations", "originalExamples"];
    const invertedIndicators = ["boilerplate", "marketingLanguage", "educationalFiller", "commonCliches", "genericExplanations"];

    for (const key of positiveIndicators) {
      const item = originalExpression[key];
      if (item && typeof item.score === "number") normalizedScores.push(item.score);
    }
    for (const key of invertedIndicators) {
      const item = originalExpression[key];
      if (item && typeof item.score === "number") normalizedScores.push(100 - item.score);
    }

    return this.deriveConfidence(normalizedScores, 10, 84);
  }

  public static calculateSimConfidence(similarityAnalysis: Record<string, any>): number {
    const scores: number[] = [];
    for (const [, item] of Object.entries(similarityAnalysis)) {
      if (item && typeof (item as any).score === "number") {
        scores.push((item as any).score);
      }
    }
    return this.deriveConfidence(scores, 8, 86);
  }

  public static calculateReadConfidence(writingQuality: Record<string, any>): number {
    const scores: number[] = [];
    for (const [, item] of Object.entries(writingQuality)) {
      if (item && typeof (item as any).score === "number") {
        scores.push((item as any).score);
      }
    }
    return this.deriveConfidence(scores, 10, 92);
  }

  /**
   * Derives a confidence score from an array of indicator scores.
   * @param scores Array of normalized indicator scores (0-100).
   * @param totalPossible Total number of indicators expected.
   * @param baseConfidence Baseline confidence for this analysis dimension.
   */
  private static deriveConfidence(scores: number[], totalPossible: number, baseConfidence: number): number {
    if (scores.length === 0) return Math.round(baseConfidence * 0.75);

    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // Certainty: distance from 50 (neutral). Strong human (<25) or AI (>75) signals yield high certainty.
    const signalStrength = Math.min(100, Math.abs(mean - 50) * 2.0);
    // Consensus: lower standard deviation = indicators agree with each other.
    const consensus = Math.max(0, 100 - stdDev * 1.5);
    // Completeness: proportion of indicators scored.
    const completeness = Math.min(1.0, scores.length / Math.max(1, totalPossible));

    // Blended calculation anchored around baseConfidence
    const dynamicFactor = (signalStrength * 0.4 + consensus * 0.4 + completeness * 100 * 0.2) / 100;
    const computed = Math.round(baseConfidence * 0.65 + dynamicFactor * 35);

    // Ensure output stays in realistic, high-grade confidence band (70% - 98%) with variation per pillar
    return Math.max(70, Math.min(98, computed));
  }
}

