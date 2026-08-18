import { RiskLevelCalculator } from "./risk-level-calculator";

export interface GeneratedSummary {
  executiveSummary: string;
  strengths: string[];
  weaknesses: string[];
  topHumanSignals: string[];
  topAISignals: string[];
  recommendations: string[];
}

/**
 * Reusable utility generating forensic summaries and signals entirely in code.
 */
export class SummaryGenerator {
  /**
   * Generates the analysis summary structure.
   */
  public static generate(
    rawResponse: Record<string, any>,
    aiScore: number,
    originalityScore: number,
    plagiarismScore: number,
    readabilityScore: number,
    confidence: number,
  ): GeneratedSummary {
    const aiForensics = rawResponse.aiForensics || {};
    const originalExpression = rawResponse.originalExpression || {};
    const similarityAnalysis = rawResponse.similarityAnalysis || {};
    const writingQuality = rawResponse.writingQuality || {};

    // 1. Top AI and Human signals extraction
    const aiIndicators = [
      { key: "templateLanguage", label: "Template Phraseology Reuse" },
      { key: "sentencePredictability", label: "Highly Uniform Sentence Flow" },
      { key: "lexicalRepetition", label: "Repetitive Vocabulary Usage" },
      { key: "genericWording", label: "General Vague Statements" },
      {
        key: "sentenceStructureRepetition",
        label: "Repetitive Sentence Openers",
      },
      { key: "confidenceInflation", label: "Unnatural Certainty Clues" },
      { key: "transitionOveruse", label: "Mechanical Logical Connectors" },
      { key: "paragraphRhythm", label: "Monotonous Paragraph Layouts" },
      { key: "informationDensity", label: "Uniform Information Density" },
      { key: "hedgingLanguage", label: "Hedging Qualifiers Overuse" },
      {
        key: "stylisticConsistency",
        label: "Unusually Uniform Stylistic Flow",
      },
      { key: "hallucinationIndicators", label: "Contradictory Logic Gaps" },
    ];

    const humanIndicators = [
      {
        key: "personalExperience",
        label: "Direct Personal Anecdote Reference",
      },
      { key: "humanImperfections", label: "Idiosyncratic Phrasing and Flaws" },
      {
        key: "narrativeAuthenticity",
        label: "Natural Narrative Pacing shifts",
      },
      { key: "creativity", label: "Original Creative Metaphors" },
      { key: "emotionalAuthenticity", label: "Sincere Value Assertions" },
      { key: "sentenceBurstiness", label: "Organic Sentence Length Shifts" },
      { key: "vocabularyDiversity", label: "Rich Vocabulary synonym choices" },
      { key: "contextSwitching", label: "Associative Context Switches" },
    ];

    // Find top AI signals based on score
    const topAISignals = aiIndicators
      .map((ind) => ({
        label: ind.label,
        score:
          typeof aiForensics[ind.key]?.score === "number"
            ? aiForensics[ind.key].score
            : 0,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .filter((x) => x.score > 40)
      .map((x) => x.label);

    // Find top Human signals based on score
    const topHumanSignals = humanIndicators
      .map((ind) => ({
        label: ind.label,
        score:
          typeof aiForensics[ind.key]?.score === "number"
            ? aiForensics[ind.key].score
            : 0,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .filter((x) => x.score > 40)
      .map((x) => x.label);

    // 2. Strengths and Weaknesses
    const strengthsList: string[] = [];
    const weaknessesList: string[] = [];
    const recommendationsList: string[] = [];

    // Check Writing Quality
    const qualityKeys = [
      { key: "grammar", label: "Grammar & Syntax Mechanics" },
      { key: "readability", label: "Readability suitability" },
      { key: "flow", label: "Style transitions flow" },
      { key: "organization", label: "Paragraph layout logic" },
      { key: "vocabulary", label: "Rich vocabulary choice" },
      { key: "argumentQuality", label: "Logical argument clarity" },
    ];

    for (const q of qualityKeys) {
      const metric = writingQuality[q.key] || {};
      const score = typeof metric.score === "number" ? metric.score : 70;
      if (score >= 80) {
        strengthsList.push(`Strong ${q.label}`);
      } else if (score <= 55) {
        weaknessesList.push(`Needs improvement in ${q.label}`);
        if (metric.recommendations && Array.isArray(metric.recommendations)) {
          recommendationsList.push(...metric.recommendations);
        } else if (typeof metric.improvement === "string") {
          recommendationsList.push(metric.improvement);
        }
      }
    }

    // Add generic fallbacks if lists are empty
    if (strengthsList.length === 0) {
      strengthsList.push(
        "Clear text formatting layout",
        "Coherent terminology usage",
      );
    }
    if (weaknessesList.length === 0) {
      weaknessesList.push("Minor sentence length variation redundancy");
    }

    // Check Original Expression Specificity
    const specMetric = originalExpression.specificity || {};
    if (typeof specMetric.score === "number" && specMetric.score >= 75) {
      strengthsList.push("High detail specificity and concrete assertions");
    }

    // Check Similarity Analysis
    const repMetric = similarityAnalysis.repeatedPhrases || {};
    if (typeof repMetric.score === "number" && repMetric.score >= 60) {
      weaknessesList.push("Repetitive structural phrasing clusters flagged");
      if (typeof repMetric.recommendations === "string") {
        recommendationsList.push(repMetric.recommendations);
      }
    }

    // Deduplicate lists
    const uniqueList = (arr: string[]) =>
      Array.from(new Set(arr)).filter(Boolean).slice(0, 4);
    const finalStrengths = uniqueList(strengthsList);
    const finalWeaknesses = uniqueList(weaknessesList);

    // 3. Compile Recommendations
    if (recommendationsList.length === 0) {
      recommendationsList.push(
        "Vary vocabulary synonyms to enhance lexical diversity.",
        "Incorporate organic transitions and varied sentence lengths.",
        "Introduce concrete descriptions and original examples.",
      );
    }
    const finalRecs = uniqueList(recommendationsList);

    // 4. Generate Executive Summary (2-4 sentences)
    const riskLabel = RiskLevelCalculator.getLabel(aiScore);
    const confidenceLabel =
      confidence >= 75 ? "strong" : confidence >= 50 ? "moderate" : "tentative";

    const originalityPhrase =
      originalityScore >= 75
        ? "high original expression"
        : originalityScore >= 50
          ? "moderate original expression"
          : "low original expression";
    const similarityPhrase =
      plagiarismScore >= 50
        ? "significant internal repetitions"
        : plagiarismScore >= 25
          ? "moderate internal repetitions"
          : "low structural repetition";

    const strengthText = finalStrengths[0]
      ? finalStrengths[0].toLowerCase()
      : "general readability";
    const weaknessText = finalWeaknesses[0]
      ? finalWeaknesses[0].toLowerCase()
      : "minor sentence length variation";

    const executiveSummary = `Forensic linguistic analysis evaluates the text at a ${riskLabel} AI Writing Probability (${aiScore}%) derived with ${confidenceLabel} confidence (${confidence}%). Observations indicate ${originalityPhrase} alongside ${similarityPhrase}. The text shows a deterministic writing quality rating of ${readabilityScore}%, with strengths noted in ${strengthText} and areas of improvement in ${weaknessText}.`;

    return {
      executiveSummary,
      strengths: finalStrengths,
      weaknesses: finalWeaknesses,
      topAISignals,
      topHumanSignals,
      recommendations: finalRecs,
    };
  }
}
