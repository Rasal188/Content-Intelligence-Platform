import { describe, expect, test } from "bun:test";
import { ScoreEngine } from "./forensics/score-engine";
import { LinguisticAnalyzerService } from "./forensics/linguistic-analyzer.service";

describe("ScoreEngine Multi-Signal Hybrid Scoring & Regression Suite", () => {
  // TEST 1: Clearly Human Text -> Predominantly Human
  test("TEST 1: Clearly human text is scored predominantly Human", () => {
    const text = "Last summer my dad and I spent two weekends rebuilding an old cedar fence in the backyard. We didn't have the right post-hole digger, so we had to borrow a rusty one from our neighbor Mr. Henderson. By Sunday afternoon my palms were covered in blisters and we had set three posts slightly crooked.";
    
    const rawResponse = {
      aiForensics: {
        personalExperience: { score: 98 },
        narrativeAuthenticity: { score: 95 },
        emotionalAuthenticity: { score: 90 },
        sentenceBurstiness: { score: 88 },
        templateLanguage: { score: 8 },
        sentencePredictability: { score: 18 },
      },
      originalExpression: {
        specificity: { score: 92 },
        concreteObservations: { score: 95 },
        boilerplate: { score: 5 },
      },
      similarityAnalysis: {
        abruptStyleShifts: { score: 0 },
        templateReuse: { score: 5 },
      },
      writingQuality: { readability: { score: 85 } },
    };

    const calculated = ScoreEngine.calculate(rawResponse, text);
    expect(calculated.humanScore).toBeGreaterThanOrEqual(90);
    expect(calculated.aiScore).toBeLessThanOrEqual(10);
    expect(calculated.humanScore + calculated.mixedScore + calculated.aiScore).toBe(100);
  });

  // TEST 2: Clearly AI Text -> Predominantly AI
  test("TEST 2: Clearly AI text is scored predominantly AI", () => {
    const text = "In today's fast-paced digital world, artificial intelligence plays a crucial role in transforming various industries. Furthermore, the integration of cutting-edge algorithms enables organizations to optimize their operational workflows and maximize overall productivity.";
    
    const rawResponse = {
      aiForensics: {
        personalExperience: { score: 0 },
        narrativeAuthenticity: { score: 5 },
        templateLanguage: { score: 98 },
        sentencePredictability: { score: 95 },
        transitionOveruse: { score: 98 },
      },
      originalExpression: {
        boilerplate: { score: 98 },
        commonCliches: { score: 98 },
        genericExplanations: { score: 98 },
      },
      similarityAnalysis: {
        abruptStyleShifts: { score: 0 },
        templateReuse: { score: 95 },
      },
      writingQuality: { readability: { score: 85 } },
    };

    const calculated = ScoreEngine.calculate(rawResponse, text);
    expect(calculated.aiScore).toBeGreaterThanOrEqual(95);
    expect(calculated.humanScore).toBeLessThanOrEqual(5);
    expect(calculated.humanScore + calculated.mixedScore + calculated.aiScore).toBe(100);
  });

  // TEST 3: Genuine Mixed Human + AI Text -> Mixed probability is non-zero and meaningful
  test("TEST 3: Genuine mixed human + AI text produces a non-zero, meaningful Mixed probability", () => {
    const text = "I was debugging a nasty race condition in our PostgreSQL connection pool yesterday at 2 AM. The server kept dropping idle connections after thirty seconds, which caused cascading 500 errors across our user dashboard. In today's fast-paced digital ecosystem, leveraging robust database connection management plays a crucial role in maintaining high availability. Furthermore, it is important to implement exponential backoff algorithms to mitigate transient network failures.";
    
    const rawResponse = {
      aiForensics: {
        personalExperience: { score: 50 },
        narrativeAuthenticity: { score: 45 },
        templateLanguage: { score: 90 },
        sentencePredictability: { score: 75 },
        transitionOveruse: { score: 85 },
        contextSwitching: { score: 80 },
      },
      originalExpression: {
        boilerplate: { score: 85 },
        commonCliches: { score: 90 },
      },
      similarityAnalysis: {
        abruptStyleShifts: { score: 88 },
        templateReuse: { score: 85 },
      },
      writingQuality: { readability: { score: 80 } },
    };

    const calculated = ScoreEngine.calculate(rawResponse, text);
    expect(calculated.mixedScore).toBeGreaterThanOrEqual(25);
    expect(calculated.aiScore).toBeLessThan(85);
    expect(calculated.humanScore + calculated.mixedScore + calculated.aiScore).toBe(100);
  });

  // TEST 4: AI Text with a few human-style sentences -> Not automatically Mixed without sufficient independent human evidence
  test("TEST 4: AI text with minor conversational phrasing remains predominantly AI without strong independent human evidence", () => {
    const text = "We should think about how AI works. In today's fast-paced digital world, artificial intelligence plays a crucial role in optimizing organizational workflows. Furthermore, leveraging automated pipelines ensures maximum efficiency.";
    
    const rawResponse = {
      aiForensics: {
        personalExperience: { score: 10 },
        narrativeAuthenticity: { score: 15 },
        templateLanguage: { score: 92 },
        sentencePredictability: { score: 90 },
        transitionOveruse: { score: 94 },
        contextSwitching: { score: 20 },
      },
      originalExpression: {
        boilerplate: { score: 92 },
        commonCliches: { score: 95 },
      },
      similarityAnalysis: {
        abruptStyleShifts: { score: 15 },
        templateReuse: { score: 90 },
      },
      writingQuality: { readability: { score: 82 } },
    };

    const calculated = ScoreEngine.calculate(rawResponse, text);
    expect(calculated.aiScore).toBeGreaterThanOrEqual(80);
    expect(calculated.humanScore + calculated.mixedScore + calculated.aiScore).toBe(100);
  });

  // TEST 5: Human technical writing with "Furthermore" or "plays a crucial role" -> Does not become 100% AI
  test("TEST 5: Human technical writing containing formal transitions does not become 100% AI when genuine human signals exist", () => {
    const text = "When I redesigned our database indexing strategy last month, our team noticed an immediate 40% reduction in query latency. Furthermore, optimizing these b-tree indexes plays a crucial role in scaling our microservices under load.";
    
    const rawResponse = {
      aiForensics: {
        personalExperience: { score: 80 },
        narrativeAuthenticity: { score: 75 },
        templateLanguage: { score: 45 },
        sentencePredictability: { score: 40 },
        transitionOveruse: { score: 60 },
      },
      originalExpression: {
        specificity: { score: 85 },
        concreteObservations: { score: 80 },
        boilerplate: { score: 40 },
      },
      similarityAnalysis: {
        abruptStyleShifts: { score: 20 },
      },
      writingQuality: { readability: { score: 88 } },
    };

    const calculated = ScoreEngine.calculate(rawResponse, text);
    expect(calculated.humanScore).toBeGreaterThanOrEqual(50);
    expect(calculated.aiScore).toBeLessThan(40);
    expect(calculated.humanScore + calculated.mixedScore + calculated.aiScore).toBe(100);
  });

  // TEST 6: Long mixed document with strong context switching -> Mixed category remains available and significant
  test("TEST 6: Long mixed document with strong context switching preserves Mixed classification", () => {
    const text = "Over the past six years working on distributed systems at my startup, I have seen countless memory leaks in production. We spent weeks chasing dangling pointers. However, in today's fast-paced digital ecosystem, leveraging cutting-edge cloud infrastructure plays a crucial role in enterprise architecture. In conclusion, it is important to note that proactive monitoring is essential.";
    
    const rawResponse = {
      aiForensics: {
        personalExperience: { score: 65 },
        narrativeAuthenticity: { score: 60 },
        templateLanguage: { score: 85 },
        sentencePredictability: { score: 70 },
        contextSwitching: { score: 85 },
      },
      originalExpression: {
        specificity: { score: 65 },
        boilerplate: { score: 75 },
      },
      similarityAnalysis: {
        abruptStyleShifts: { score: 85 },
      },
      writingQuality: { readability: { score: 85 } },
    };

    const calculated = ScoreEngine.calculate(rawResponse, text);
    expect(calculated.mixedScore).toBeGreaterThanOrEqual(25);
    expect(calculated.humanScore + calculated.mixedScore + calculated.aiScore).toBe(100);
  });
});
