import { FORENSIC_SCORING_CONFIG } from "../prompt-config";
import {
  LinguisticAnalyzerService,
  type LinguisticMetrics,
} from "./linguistic-analyzer.service";

export interface CalculatedScores {
  humanScore: number;
  aiScore: number;
  chipAi?: number;
  mixedScore: number;
  originalityScore: number;
  plagiarismScore: number;
  readabilityScore: number;
  overallScore: number;
  linguisticMetrics?: LinguisticMetrics;
}

/**
 * Hybrid deterministic forensic scoring engine combining statistical text metrics with LLM semantic indicators.
 */
export class ScoreEngine {
  /**
   * Computes all primary classification metrics and probability distribution.
   * @param rawResponse The validated JSON payload from the AI gateway.
   * @param textContent The original analyzed text content (used for deterministic statistical metrics).
   * @returns CalculatedScores object.
   */
  public static calculate(
    rawResponse: Record<string, any>,
    textContent = "",
  ): CalculatedScores {
    const weights = FORENSIC_SCORING_CONFIG;

    // 1. Calculate Deterministic Mathematical Linguistic Metrics
    const linguisticMetrics = textContent
      ? LinguisticAnalyzerService.analyze(textContent)
      : undefined;
    const statAi = linguisticMetrics?.statisticalAiProbability ?? 50;
    const statHuman = linguisticMetrics?.statisticalHumanProbability ?? 50;

    // 2. Calculate LLM Semantic AI and Human Indicator Averages
    const aiForensics = rawResponse.aiForensics || {};
    let totalAiWeight = 0;
    let weightedAiSum = 0;

    let totalHumanWeight = 0;
    let weightedHumanSum = 0;

    const aiIndicators = [
      "templateLanguage",
      "sentencePredictability",
      "lexicalRepetition",
      "genericWording",
      "sentenceStructureRepetition",
      "confidenceInflation",
      "transitionOveruse",
      "paragraphRhythm",
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
      const w = (weights.aiForensics as Record<string, number>)[key] || 5;
      const metric = aiForensics[key] || {};
      const score = typeof metric.score === "number" ? metric.score : 50;
      totalAiWeight += w;
      weightedAiSum += score * w;
    }

    for (const key of humanIndicators) {
      const w = (weights.aiForensics as Record<string, number>)[key] || 8;
      const metric = aiForensics[key] || {};
      const score = typeof metric.score === "number" ? metric.score : 50;
      totalHumanWeight += w;
      weightedHumanSum += score * w;
    }

    const rawAiAvg = totalAiWeight > 0 ? weightedAiSum / totalAiWeight : 50;
    const rawHumanAvg =
      totalHumanWeight > 0 ? weightedHumanSum / totalHumanWeight : 50;

    // 3. Enterprise Deterministic Hybrid Blending
    // Blends 50% LLM Semantic Evaluation + 50% Deterministic Mathematical Metrics
    const blendedAi = Math.round(rawAiAvg * 0.5 + statAi * 0.5);
    const blendedHuman = Math.round(rawHumanAvg * 0.5 + statHuman * 0.5);

    let aiProb = blendedAi;
    let humanProb = blendedHuman;

    // Firm Decision Boundaries (Modeled after GPTZero & CopyLeaks):
    // A. Authentic Human Verification (Strong first-person anchors OR high burstiness with low AI signals)
    if (
      linguisticMetrics &&
      linguisticMetrics.firstPersonNarrativeScore >= 25 &&
      statAi <= 30
    ) {
      aiProb = Math.min(6, Math.round(blendedAi * 0.25));
      humanProb = Math.max(
        92,
        Math.round(blendedHuman + (100 - blendedAi) * 0.2),
      );
    } else if (blendedHuman >= 65 && blendedAi <= 35) {
      aiProb = Math.min(8, Math.round(blendedAi * 0.3));
      humanProb = Math.max(
        88,
        Math.round(blendedHuman + (100 - blendedAi) * 0.15),
      );
    }
    // B. AI Verification (Dense transitions OR bypass tool artifacts OR formulaic cadence OR high statistical AI)
    else if (
      linguisticMetrics &&
      (linguisticMetrics.aiTransitionPenaltyScore >= 20 ||
        linguisticMetrics.humanizerArtifactScore >= 20 ||
        statAi >= 55)
    ) {
      humanProb = Math.min(2, Math.round(blendedHuman * 0.1));
      aiProb = Math.max(94, Math.round(Math.max(blendedAi, statAi, 94)));
    } else if (blendedAi >= 40 && blendedHuman <= 60) {
      humanProb = Math.min(5, Math.round(blendedHuman * 0.2));
      aiProb = Math.max(92, Math.round(blendedAi + (100 - blendedHuman) * 0.4));
    }

    aiProb = Math.max(0, Math.min(100, aiProb));
    humanProb = Math.max(0, Math.min(100, humanProb));

    // 4. Probability Distribution across the 3 chips (Human, Mixed, AI) matching GPTZero
    let chipHuman = 0;
    let chipAi = 0;
    let chipMixed = 0;

    if (aiProb <= 15) {
      // Unambiguous Human content
      chipHuman = 100 - aiProb;
      chipAi = aiProb;
      chipMixed = 0;
    } else if (aiProb >= 60) {
      // Unambiguous AI content (Matches GPTZero: AI 100% / Mixed 0% / Human 0%)
      chipAi = 100;
      chipHuman = 0;
      chipMixed = 0;
    } else {
      // Intermediate / Paraphrased / Mixed Content
      chipAi = aiProb;
      chipHuman = Math.max(0, 100 - aiProb - 30);
      chipMixed = 100 - chipAi - chipHuman;
    }

    // Normalize so chipHuman + chipMixed + chipAi = 100%
    const chipTotal = chipHuman + chipMixed + chipAi;
    if (chipTotal > 0) {
      chipHuman = Math.round((chipHuman / chipTotal) * 100);
      chipAi = Math.round((chipAi / chipTotal) * 100);
      chipMixed = Math.max(0, 100 - chipHuman - chipAi);
    }

    // 3. Calculate Original Expression Index
    const originalExpression = rawResponse.originalExpression || {};
    let totalOrigWeight = 0;
    let weightedOrigSum = 0;

    const origIndicators = [
      { key: "specificity", isInverted: false },
      { key: "uniqueWording", isInverted: false },
      { key: "lexicalDiversity", isInverted: false },
      { key: "concreteObservations", isInverted: false },
      { key: "originalExamples", isInverted: false },
      { key: "boilerplate", isInverted: true },
      { key: "marketingLanguage", isInverted: true },
      { key: "educationalFiller", isInverted: true },
      { key: "commonCliches", isInverted: true },
      { key: "genericExplanations", isInverted: true },
    ];

    for (const ind of origIndicators) {
      const w =
        (weights.originalExpression as Record<string, number>)[ind.key] || 0;
      const metric = originalExpression[ind.key] || {};
      const score = typeof metric.score === "number" ? metric.score : 50;
      totalOrigWeight += w;
      if (ind.isInverted) {
        weightedOrigSum += (100 - score) * w;
      } else {
        weightedOrigSum += score * w;
      }
    }

    // 4. Calculate Similarity Index
    const similarityAnalysis = rawResponse.similarityAnalysis || {};
    let totalSimWeight = 0;
    let weightedSimSum = 0;

    for (const [key, w] of Object.entries(weights.similarityAnalysis)) {
      const metric = similarityAnalysis[key] || {};
      const score = typeof metric.score === "number" ? metric.score : 0;
      totalSimWeight += w;
      weightedSimSum += score * w;
    }

    const plagiarismScore =
      totalSimWeight > 0 ? Math.round(weightedSimSum / totalSimWeight) : 0;

    let calculatedOrig =
      totalOrigWeight > 0
        ? Math.round(weightedOrigSum / totalOrigWeight)
        : Math.max(0, 100 - plagiarismScore);

    // Ensure Originality Score is consistent with Plagiarism/Similarity Risk
    if (plagiarismScore <= 15 && calculatedOrig < 70) {
      calculatedOrig = Math.max(
        calculatedOrig,
        100 - plagiarismScore - Math.round(aiProb * 0.1),
      );
    }
    const originalityScore = Math.max(5, Math.min(100, calculatedOrig));

    // 5. Calculate Writing Quality Index (Readability)
    const writingQuality = rawResponse.writingQuality || {};
    let totalQualWeight = 0;
    let weightedQualSum = 0;

    for (const [key, w] of Object.entries(weights.writingQuality)) {
      const metric = writingQuality[key] || {};
      const score = typeof metric.score === "number" ? metric.score : 70;
      totalQualWeight += w;
      weightedQualSum += score * w;
    }

    const readabilityScore =
      totalQualWeight > 0 ? Math.round(weightedQualSum / totalQualWeight) : 80;

    return {
      humanScore: chipHuman,
      aiScore: chipAi,
      chipAi,
      mixedScore: chipMixed,
      originalityScore: Math.max(0, Math.min(100, originalityScore)),
      plagiarismScore: Math.max(0, Math.min(100, plagiarismScore)),
      readabilityScore: Math.max(0, Math.min(100, readabilityScore)),
      overallScore: chipHuman,
    };
  }
}
