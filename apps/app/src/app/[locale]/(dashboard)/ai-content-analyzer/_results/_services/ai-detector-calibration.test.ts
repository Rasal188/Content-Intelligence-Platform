import { describe, expect, test } from "bun:test";
import { ConfidenceCalculator } from "./forensics/confidence-calculator";
import { LinguisticAnalyzerService } from "./forensics/linguistic-analyzer.service";
import { ScoreEngine } from "./forensics/score-engine";
import { InputQualityAnalyzerService } from "./input-quality-analyzer.service";

describe("AI Content Detector Calibration & Forensic Hardening Suite", () => {
  // 1. Random & Gibberish Inputs
  test("1. Random string is rejected by input quality gate", () => {
    const randomText = "syasydfvsufvofsagftasyfgaiufyafssfvy";
    const res = InputQualityAnalyzerService.evaluate(randomText);
    expect(res.classifiable).toBe(false);
    expect(res.status).toBe("INSUFFICIENT");
    expect(res.confidence).toBe(0);
  });

  test("2. Repeated characters and symbols are rejected as unanalyzable", () => {
    const repeated = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const repRes = InputQualityAnalyzerService.evaluate(repeated);
    expect(repRes.classifiable).toBe(false);

    const symbols = "!@#$%^&*()_+=[]{}";
    const symRes = InputQualityAnalyzerService.evaluate(symbols);
    expect(symRes.classifiable).toBe(false);
  });

  // 2. Short Human Text Calibration (21-word sample)
  test("3. 21-word human text does NOT produce high AI score or artificial confidence", () => {
    const human21Words = "I completed the quarterly financial report yesterday evening and submitted all supporting transaction ledgers to our internal accounting audit team.";
    
    // Quality evaluation
    const quality = InputQualityAnalyzerService.evaluate(human21Words);
    expect(quality.classifiable).toBe(true);
    expect(quality.status).toBe("LOW_CONFIDENCE");
    expect(quality.confidence).toBeLessThanOrEqual(50);

    // Score evaluation
    const mockLlmResponse = {
      aiForensics: {
        templateLanguage: { score: 40 },
        genericWording: { score: 40 },
        sentenceBurstiness: { score: 60 },
        vocabularyDiversity: { score: 65 },
      },
    };

    const scores = ScoreEngine.calculate(mockLlmResponse, human21Words);
    // Human probability must dominate for genuine human writing
    expect(scores.humanScore).toBeGreaterThanOrEqual(80);
    expect(scores.aiScore).toBeLessThanOrEqual(20);
    // Probabilities must sum to 100%
    expect(scores.humanScore + scores.mixedScore + scores.aiScore).toBe(100);

    // Confidence must be appropriately bounded for short 21-word sample (<50%)
    const confidence = ConfidenceCalculator.calculateAiConfidence(mockLlmResponse.aiForensics, 21);
    expect(confidence).toBeLessThanOrEqual(50);
  });

  // 3. Clear AI Prose vs Clear Human Prose
  test("4. Clear AI text produces high AI likelihood while Human text produces high Human likelihood", () => {
    const aiText = "In today's fast-paced digital world, artificial intelligence plays a crucial and pivotal role in navigating complex operational challenges and fostering sustainable growth.";
    const mockAiLlm = {
      aiForensics: {
        templateLanguage: { score: 95 },
        transitionOveruse: { score: 95 },
        genericWording: { score: 90 },
      },
    };
    const aiScores = ScoreEngine.calculate(mockAiLlm, aiText);
    expect(aiScores.aiScore).toBeGreaterThanOrEqual(90);

    const humanText = "When I started coding back in 2014, my brother and I built our first web scraper in our basement using Python. We made plenty of silly mistakes along the way.";
    const mockHumanLlm = {
      aiForensics: {
        personalExperience: { score: 95 },
        narrativeAuthenticity: { score: 90 },
        templateLanguage: { score: 10 },
      },
    };
    const humanScores = ScoreEngine.calculate(mockHumanLlm, humanText);
    expect(humanScores.humanScore).toBeGreaterThanOrEqual(85);
  });

  // 4. Mathematical Coherence (Human + Mixed + AI = 100)
  test("5. Probabilities always sum to 100% and confidence is bounded", () => {
    const testCases = [
      { text: "Short test.", aiAvg: 30 },
      { text: "Medium length text explaining software deployment pipelines.", aiAvg: 60 },
      { text: "Another ambiguous piece of mixed writing with some edits.", aiAvg: 45 },
    ];

    for (const tc of testCases) {
      const mockResp = {
        aiForensics: {
          templateLanguage: { score: tc.aiAvg },
          sentenceBurstiness: { score: 50 },
        },
      };
      const sc = ScoreEngine.calculate(mockResp, tc.text);
      expect(sc.humanScore + sc.mixedScore + sc.aiScore).toBe(100);
      expect(sc.humanScore).toBeGreaterThanOrEqual(0);
      expect(sc.aiScore).toBeGreaterThanOrEqual(0);
      expect(sc.mixedScore).toBeGreaterThanOrEqual(0);
    }
  });
});
