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
      const metric = aiForensics[key];
      if (metric && typeof metric.score === "number") {
        totalAiWeight += w;
        weightedAiSum += metric.score * w;
      }
    }

    for (const key of humanIndicators) {
      const w = (weights.aiForensics as Record<string, number>)[key] || 8;
      const metric = aiForensics[key];
      if (metric && typeof metric.score === "number") {
        totalHumanWeight += w;
        weightedHumanSum += metric.score * w;
      }
    }

    const rawAiAvg = totalAiWeight > 0 ? weightedAiSum / totalAiWeight : (aiForensics.templateLanguage?.score ?? 50);
    const rawHumanAvg =
      totalHumanWeight > 0 ? weightedHumanSum / totalHumanWeight : (aiForensics.personalExperience?.score ?? 50);

    // 3. Enterprise Multi-Signal Evidence Aggregation
    const originalExpression = rawResponse.originalExpression || {};
    const similarityAnalysis = rawResponse.similarityAnalysis || {};

    // Extract key contextual indicators (0-100)
    const personalExpScore = typeof aiForensics.personalExperience?.score === "number" ? aiForensics.personalExperience.score : 0;
    const narrativeAuthScore = typeof aiForensics.narrativeAuthenticity?.score === "number" ? aiForensics.narrativeAuthenticity.score : 0;
    const contextSwitchingScore = typeof aiForensics.contextSwitching?.score === "number" ? aiForensics.contextSwitching.score : 0;
    const abruptStyleShiftsScore = typeof similarityAnalysis.abruptStyleShifts?.score === "number" ? similarityAnalysis.abruptStyleShifts.score : 0;
    const templateLangScore = typeof aiForensics.templateLanguage?.score === "number" ? aiForensics.templateLanguage.score : (rawAiAvg || 50);
    const boilerplateScore = typeof originalExpression.boilerplate?.score === "number" ? originalExpression.boilerplate.score : (rawAiAvg || 50);

    // Composite human narrative strength from both LLM and deterministic text analysis
    const humanSignalStrength = Math.max(
      rawHumanAvg,
      personalExpScore * 0.5 + narrativeAuthScore * 0.5,
      linguisticMetrics?.firstPersonNarrativeScore ?? 0,
    );

    // Composite AI template strength from LLM and deterministic text analysis
    const aiSignalStrength = Math.max(
      rawAiAvg,
      templateLangScore * 0.5 + boilerplateScore * 0.5,
      humanSignalStrength >= 65 ? (linguisticMetrics?.aiTransitionPenaltyScore ?? 0) * 0.4 : (linguisticMetrics?.aiTransitionPenaltyScore ?? 0),
    );

    // Style-shift / Hybrid variance index (0-100): High when LLM detects distinct authorial shifts or co-existing strong signals
    const hybridDiscontinuityIndex = Math.max(
      abruptStyleShiftsScore,
      // Only treat context switching as a hybrid shift if both AI and human signals are meaningfully elevated
      Math.min(humanSignalStrength, aiSignalStrength) >= 30 ? contextSwitchingScore : 0,
      (humanSignalStrength >= 40 && aiSignalStrength >= 55) ? Math.min(humanSignalStrength, aiSignalStrength) * 1.2 : 0,
    );

    // Sample-size aware weighting:
    // When text is short (< 35 words), statistical variance is unreliable. Lean on semantic indicators.
    const isShort = linguisticMetrics ? linguisticMetrics.wordCount < 35 || linguisticMetrics.sentenceCount < 3 : false;
    const statWeight = isShort ? 0.25 : 0.45;
    const semWeight = 1.0 - statWeight;

    // If strong human signals co-exist with AI transitions (e.g. human narrative + technical/AI phrases),
    // moderate the statistical AI transition penalty so a single transition doesn't erase human authorship.
    let calibratedStatAi = statAi;
    let calibratedStatHuman = statHuman;
    if (humanSignalStrength >= 40 && linguisticMetrics && linguisticMetrics.aiTransitionPenaltyScore > 0) {
      const penaltyDampening = Math.min(0.95, (humanSignalStrength - 20) / 50);
      calibratedStatAi = Math.round(statAi * (1 - penaltyDampening) + (100 - humanSignalStrength) * penaltyDampening);
      calibratedStatHuman = Math.max(0, 100 - calibratedStatAi);
    }

    const blendedAi = Math.round(rawAiAvg * semWeight + calibratedStatAi * statWeight);
    const blendedHuman = Math.round(rawHumanAvg * semWeight + calibratedStatHuman * statWeight);

    let aiProb = blendedAi;
    let humanProb = blendedHuman;

    // Multi-signal decision boundaries:
    // A. Clearly Authentic Human Text (High narrative/burstiness, low AI signals, no major template patterns)
    if (
      (linguisticMetrics && linguisticMetrics.firstPersonNarrativeScore >= 25) ||
      (humanSignalStrength >= 65 && aiSignalStrength <= 60 && hybridDiscontinuityIndex < 40) ||
      (isShort && statAi <= 15 && rawAiAvg <= 35)
    ) {
      aiProb = Math.min(15, Math.round(blendedAi * 0.3));
      humanProb = Math.max(75, Math.round(blendedHuman + (100 - blendedAi) * 0.2));
    }
    // B. Clearly Pure AI Text (Uniform cadence, no personal narrative, high template language, zero style-shifts)
    else if (
      aiSignalStrength >= 75 &&
      humanSignalStrength <= 20 &&
      hybridDiscontinuityIndex <= 30
    ) {
      humanProb = Math.min(3, Math.round(blendedHuman * 0.1));
      aiProb = Math.max(95, Math.round(blendedAi + (100 - blendedHuman) * 0.3));
    }
    // C. Mixed / Hybrid Co-Authorship (Document exhibits both human evidence and AI templates, or strong style-shifts)
    else if (
      hybridDiscontinuityIndex >= 45 ||
      (humanSignalStrength >= 30 && aiSignalStrength >= 45) ||
      (blendedAi >= 40 && blendedHuman >= 30)
    ) {
      // Retain the nuanced blend without collapsing to 100% or 0%
      aiProb = Math.max(15, Math.min(85, blendedAi));
      humanProb = Math.max(15, Math.min(85, blendedHuman));
    }

    aiProb = Math.max(0, Math.min(100, aiProb));
    humanProb = Math.max(0, Math.min(100, humanProb));

    // 4. Multi-Class Probability Distribution across Human, Mixed, and AI
    let chipHuman = 0;
    let chipAi = 0;
    let chipMixed = 0;

    // Case 1: Decisive Human Dominance (aiProb <= 20 and humanProb >= 75 with low hybrid discontinuity)
    if ((aiProb <= 15 || (aiProb <= 20 && humanProb >= 75)) && (hybridDiscontinuityIndex < 40 || humanSignalStrength >= 70)) {
      chipHuman = 100 - aiProb;
      chipAi = aiProb;
      chipMixed = 0;
    }
    // Case 2: Decisive Pure AI Dominance (aiProb >= 85 and near-zero human narrative / zero style shifts)
    else if (aiProb >= 85 && humanSignalStrength <= 15 && hybridDiscontinuityIndex < 35) {
      chipAi = Math.min(100, aiProb);
      chipHuman = Math.max(0, 100 - aiProb);
      chipMixed = 0;
    }
    // Case 3: Genuine Mixed / Blended Content
    else {
      // Calculate dynamic mixed allocation proportional to hybrid evidence and signal balance
      const signalCloseness = Math.max(0, 100 - Math.abs(aiProb - humanProb) * 1.5);
      const styleShiftWeight = Math.min(100, hybridDiscontinuityIndex);
      const mixedAffinity = Math.round((signalCloseness * 0.5 + styleShiftWeight * 0.5));

      // Mixed proportion ranges dynamically based on evidence (typically 20% - 60%)
      const mixedPercent = Math.max(15, Math.min(65, Math.round(mixedAffinity * 0.6)));

      const remainingPercent = 100 - mixedPercent;
      const totalTwoSignals = aiProb + humanProb || 1;
      chipAi = Math.round((aiProb / totalTwoSignals) * remainingPercent);
      chipHuman = Math.round((humanProb / totalTwoSignals) * remainingPercent);
      chipMixed = Math.max(0, 100 - chipAi - chipHuman);
    }

    // Strict Probability Invariant Normalization: chipHuman + chipMixed + chipAi = 100%
    const chipTotal = chipHuman + chipMixed + chipAi;
    if (chipTotal > 0) {
      chipHuman = Math.round((chipHuman / chipTotal) * 100);
      chipAi = Math.round((chipAi / chipTotal) * 100);
      chipMixed = Math.max(0, 100 - chipHuman - chipAi);
    }

    // 3. Calculate Original Expression Index
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
